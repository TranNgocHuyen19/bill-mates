from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import httpx
from fastapi import status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.activity.models import ActivityLog
from src.config import settings
from src.exceptions import AppError
from src.expenses import repository
from src.expenses.calculations import calculate_split
from src.expenses.models import Expense, ExpenseItem, ExpenseItemSplit, ExpenseReceipt
from src.expenses.ocr import (
    OcrProcessingError,
    OcrUnavailableError,
    process_receipt_image,
)
from src.expenses.schemas import (
    ExpenseDraftCreate,
    ExpenseDraftUpdate,
    ExpenseItemCreate,
    SplitUpdate,
)
from src.models import ExpenseStatus, MembershipStatus, OcrStatus, RoomRole
from src.rooms.models import Category, Room, RoomMember
from src.rooms.service import MANAGER_ROLES, require_room_member
from src.users.dependencies import AuthenticatedUser

CENT = Decimal("0.01")
MAX_RECEIPT_BYTES = 10 * 1024 * 1024
ALLOWED_RECEIPT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _expense_payload(
    expense: Expense,
    items: list[ExpenseItem],
    splits: list[ExpenseItemSplit],
) -> dict[str, Any]:
    splits_by_item: dict[UUID, list[ExpenseItemSplit]] = {}
    for split in splits:
        splits_by_item.setdefault(split.expense_item_id, []).append(split)
    return {
        "id": expense.id,
        "room_id": expense.room_id,
        "created_by_member_id": expense.created_by_member_id,
        "paid_by_member_id": expense.paid_by_member_id,
        "title": expense.title,
        "note": expense.note,
        "total_amount": expense.total_amount,
        "expense_date": expense.expense_date,
        "status": expense.status,
        "posted_at": expense.posted_at,
        "cancelled_at": expense.cancelled_at,
        "created_at": expense.created_at,
        "updated_at": expense.updated_at,
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_amount": item.total_amount,
                "category_id": item.category_id,
                "position": item.position,
                "splits": splits_by_item.get(item.id, []),
            }
            for item in items
        ],
    }


async def _expense_detail(
    session: AsyncSession,
    expense: Expense,
) -> dict[str, Any]:
    items = await repository.list_items(session, expense.id)
    splits = await repository.list_splits(session, [item.id for item in items])
    return _expense_payload(expense, items, splits)


async def _editable_expense(
    session: AsyncSession,
    user: AuthenticatedUser,
    expense_id: UUID,
) -> tuple[Expense, RoomMember]:
    expense = await repository.get_expense(session, expense_id, for_update=True)
    if expense is None:
        raise AppError(
            code="expense_not_found",
            message="Không tìm thấy khoản chi.",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    actor = await require_room_member(session, expense.room_id, user.id)
    if expense.status != ExpenseStatus.DRAFT:
        raise AppError(
            code="expense_not_editable",
            message="Chỉ có thể sửa khoản chi đang ở trạng thái nháp.",
            status_code=status.HTTP_409_CONFLICT,
        )
    if actor.id != expense.created_by_member_id and actor.role not in MANAGER_ROLES:
        raise AppError(
            code="expense_edit_denied",
            message="Bạn không có quyền sửa đơn nháp này.",
            status_code=status.HTTP_403_FORBIDDEN,
        )
    return expense, actor


async def _validate_paid_member(
    session: AsyncSession,
    room_id: UUID,
    member_id: UUID,
) -> RoomMember:
    member = await session.get(RoomMember, member_id)
    if (
        member is None
        or member.room_id != room_id
        or member.status != MembershipStatus.ACTIVE
    ):
        raise AppError(
            code="invalid_paid_member",
            message="Người trả tiền phải là thành viên đang hoạt động của phòng.",
            status_code=422,
        )
    return member


class ExpenseService:
    @staticmethod
    async def create_draft(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        data: ExpenseDraftCreate,
    ) -> dict[str, Any]:
        actor = await require_room_member(session, room_id, user.id)
        room = await session.get(Room, room_id)
        if room is None:
            raise AppError(
                code="room_not_found",
                message="Không tìm thấy phòng.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        if room.archived_at is not None:
            raise AppError(
                code="room_archived",
                message="Phòng đã lưu trữ nên không nhận khoản chi mới.",
                status_code=status.HTTP_409_CONFLICT,
            )
        await _validate_paid_member(session, room_id, data.paid_by_member_id)

        expense = Expense(
            room_id=room_id,
            created_by_member_id=actor.id,
            paid_by_member_id=data.paid_by_member_id,
            title=data.title,
            note=data.note,
            total_amount=data.total_amount,
            expense_date=data.expense_date,
            status=ExpenseStatus.DRAFT,
        )
        session.add(expense)
        await session.flush()
        session.add(
            ActivityLog(
                room_id=room_id,
                actor_profile_id=user.id,
                action="expense.draft_created",
                entity_type="expense",
                entity_id=expense.id,
                new_values={
                    "title": expense.title,
                    "total_amount": str(expense.total_amount),
                },
            )
        )
        await session.commit()
        await session.refresh(expense)
        return await _expense_detail(session, expense)

    @staticmethod
    async def list_expenses(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        *,
        expense_status: ExpenseStatus | None,
        limit: int,
        offset: int,
    ) -> list[dict[str, Any]]:
        await require_room_member(session, room_id, user.id)
        expenses = await repository.list_expenses(
            session,
            room_id,
            expense_status=expense_status,
            limit=limit,
            offset=offset,
        )
        return [await _expense_detail(session, expense) for expense in expenses]

    @staticmethod
    async def get_expense(
        session: AsyncSession,
        user: AuthenticatedUser,
        expense_id: UUID,
    ) -> dict[str, Any]:
        expense = await repository.get_expense(session, expense_id)
        if expense is None:
            raise AppError(
                code="expense_not_found",
                message="Không tìm thấy khoản chi.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        await require_room_member(session, expense.room_id, user.id)
        return await _expense_detail(session, expense)

    @staticmethod
    async def update_draft(
        session: AsyncSession,
        user: AuthenticatedUser,
        expense_id: UUID,
        data: ExpenseDraftUpdate,
    ) -> dict[str, Any]:
        expense, _ = await _editable_expense(session, user, expense_id)
        values = data.model_dump(exclude_unset=True)
        if paid_by_member_id := values.get("paid_by_member_id"):
            await _validate_paid_member(session, expense.room_id, paid_by_member_id)
        for field, value in values.items():
            setattr(expense, field, value)
        await session.commit()
        await session.refresh(expense)
        return await _expense_detail(session, expense)

    @staticmethod
    async def add_item(
        session: AsyncSession,
        user: AuthenticatedUser,
        expense_id: UUID,
        data: ExpenseItemCreate,
    ) -> dict[str, Any]:
        expense, _ = await _editable_expense(session, user, expense_id)
        if data.category_id is not None:
            category = await session.get(Category, data.category_id)
            if category is None or category.room_id != expense.room_id:
                raise AppError(
                    code="invalid_category",
                    message="Danh mục không thuộc phòng của khoản chi.",
                    status_code=422,
                )
        item = ExpenseItem(
            expense_id=expense.id,
            name=data.name,
            quantity=data.quantity,
            unit_price=data.unit_price,
            total_amount=(data.quantity * data.unit_price).quantize(CENT),
            category_id=data.category_id,
            position=data.position,
        )
        if item.total_amount <= 0:
            raise AppError(
                code="invalid_item_total",
                message="Tổng tiền món phải lớn hơn 0.",
                status_code=422,
            )
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return {
            "id": item.id,
            "name": item.name,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total_amount": item.total_amount,
            "category_id": item.category_id,
            "position": item.position,
            "splits": [],
        }

    @staticmethod
    async def delete_item(
        session: AsyncSession,
        user: AuthenticatedUser,
        item_id: UUID,
    ) -> None:
        item = await session.get(ExpenseItem, item_id)
        if item is None:
            raise AppError(
                code="item_not_found",
                message="Không tìm thấy món.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        await _editable_expense(session, user, item.expense_id)
        await session.delete(item)
        await session.commit()

    @staticmethod
    async def update_splits(
        session: AsyncSession,
        user: AuthenticatedUser,
        item_id: UUID,
        data: SplitUpdate,
    ) -> list[ExpenseItemSplit]:
        item = await session.get(ExpenseItem, item_id)
        if item is None:
            raise AppError(
                code="item_not_found",
                message="Không tìm thấy món.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        expense, _ = await _editable_expense(session, user, item.expense_id)
        member_ids = [participant.member_id for participant in data.splits]
        members = list(
            await session.scalars(
                select(RoomMember).where(RoomMember.id.in_(member_ids))
            )
        )
        if len(members) != len(member_ids) or any(
            member.room_id != expense.room_id
            or member.status != MembershipStatus.ACTIVE
            for member in members
        ):
            raise AppError(
                code="invalid_split_member",
                message="Mọi người được chia phải là thành viên đang hoạt động của phòng.",
                status_code=422,
            )

        amounts = calculate_split(
            total=item.total_amount,
            method=data.method,
            participants=data.splits,
        )
        splits = [
            ExpenseItemSplit(
                expense_item_id=item.id,
                member_id=participant.member_id,
                split_method=data.method,
                share_value=participant.share_value,
                amount_owed=amounts[participant.member_id],
            )
            for participant in data.splits
        ]
        await repository.replace_splits(session, item.id, splits)
        await session.commit()
        for split in splits:
            await session.refresh(split)
        return splits

    @staticmethod
    async def post_expense(
        session: AsyncSession,
        user: AuthenticatedUser,
        expense_id: UUID,
    ) -> dict[str, Any]:
        expense, _ = await _editable_expense(session, user, expense_id)
        items = await repository.list_items(session, expense.id)
        if not items:
            raise AppError(
                code="expense_items_required",
                message="Khoản chi cần ít nhất một món.",
                status_code=422,
            )
        if (
            sum((item.total_amount for item in items), Decimal(0))
            != expense.total_amount
        ):
            raise AppError(
                code="expense_total_mismatch",
                message="Tổng tiền các món chưa bằng tổng hóa đơn.",
                status_code=422,
                details={
                    "expense_total": str(expense.total_amount),
                    "items_total": str(sum(item.total_amount for item in items)),
                },
            )
        splits = await repository.list_splits(session, [item.id for item in items])
        splits_by_item: dict[UUID, list[ExpenseItemSplit]] = {}
        for split in splits:
            splits_by_item.setdefault(split.expense_item_id, []).append(split)
        for item in items:
            item_splits = splits_by_item.get(item.id, [])
            if (
                not item_splits
                or sum(
                    (split.amount_owed for split in item_splits),
                    Decimal(0),
                )
                != item.total_amount
            ):
                raise AppError(
                    code="item_split_mismatch",
                    message=f"Phần chia của món '{item.name}' chưa khớp tổng tiền.",
                    status_code=422,
                )

        expense.status = ExpenseStatus.POSTED
        expense.posted_at = datetime.now(UTC)
        session.add(
            ActivityLog(
                room_id=expense.room_id,
                actor_profile_id=user.id,
                action="expense.posted",
                entity_type="expense",
                entity_id=expense.id,
                new_values={"status": ExpenseStatus.POSTED.value},
            )
        )
        await session.commit()
        await session.refresh(expense)
        return _expense_payload(expense, items, splits)

    @staticmethod
    async def cancel_expense(
        session: AsyncSession,
        user: AuthenticatedUser,
        expense_id: UUID,
    ) -> None:
        expense = await repository.get_expense(session, expense_id, for_update=True)
        if expense is None:
            raise AppError(
                code="expense_not_found",
                message="Không tìm thấy khoản chi.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        actor = await require_room_member(session, expense.room_id, user.id)
        if actor.id != expense.created_by_member_id and actor.role not in {
            RoomRole.OWNER,
            RoomRole.ADMIN,
        }:
            raise AppError(
                code="expense_cancel_denied",
                message="Bạn không có quyền hủy khoản chi này.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        if expense.status == ExpenseStatus.CANCELLED:
            return
        old_status = expense.status
        expense.status = ExpenseStatus.CANCELLED
        expense.cancelled_at = datetime.now(UTC)
        session.add(
            ActivityLog(
                room_id=expense.room_id,
                actor_profile_id=user.id,
                action="expense.cancelled",
                entity_type="expense",
                entity_id=expense.id,
                old_values={"status": old_status.value},
                new_values={"status": ExpenseStatus.CANCELLED.value},
            )
        )
        await session.commit()

    @staticmethod
    async def upload_receipt(
        session: AsyncSession,
        user: AuthenticatedUser,
        expense_id: UUID,
        *,
        filename: str,
        mime_type: str,
        content: bytes,
    ) -> ExpenseReceipt:
        expense = await repository.get_expense(session, expense_id)
        if expense is None:
            raise AppError(
                code="expense_not_found",
                message="Không tìm thấy khoản chi.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        await require_room_member(session, expense.room_id, user.id)
        if mime_type not in ALLOWED_RECEIPT_TYPES:
            raise AppError(
                code="receipt_type_not_allowed",
                message="Ảnh hóa đơn phải là JPEG, PNG hoặc WebP.",
                status_code=422,
            )
        if not content or len(content) > MAX_RECEIPT_BYTES:
            raise AppError(
                code="receipt_size_invalid",
                message="Ảnh hóa đơn phải nhỏ hơn 10 MB.",
                status_code=422,
            )

        extension = Path(filename).suffix.lower() or ".jpg"
        storage_path = (
            f"rooms/{expense.room_id}/expenses/{expense.id}/{uuid4()}{extension}"
        )
        bucket = "receipts"
        headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "content-type": mime_type,
            "x-upsert": "false",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/{bucket}/{storage_path}",
                headers=headers,
                content=content,
            )
        if response.is_error:
            raise AppError(
                code="receipt_upload_failed",
                message="Không thể lưu ảnh hóa đơn vào Supabase Storage.",
                status_code=status.HTTP_502_BAD_GATEWAY,
                details={"storage_status": response.status_code},
            )

        receipt = ExpenseReceipt(
            expense_id=expense.id,
            bucket=bucket,
            storage_path=storage_path,
            filename=filename,
            mime_type=mime_type,
            size_bytes=len(content),
            ocr_status=OcrStatus.NOT_REQUESTED,
        )
        session.add(receipt)
        await session.commit()
        await session.refresh(receipt)
        return receipt

    @staticmethod
    async def list_receipts(
        session: AsyncSession,
        user: AuthenticatedUser,
        expense_id: UUID,
    ) -> list[ExpenseReceipt]:
        expense = await repository.get_expense(session, expense_id)
        if expense is None:
            raise AppError(
                code="expense_not_found",
                message="Không tìm thấy khoản chi.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        await require_room_member(session, expense.room_id, user.id)
        return await repository.list_receipts(session, expense_id)

    @staticmethod
    async def get_receipt(
        session: AsyncSession,
        user: AuthenticatedUser,
        receipt_id: UUID,
    ) -> ExpenseReceipt:
        receipt = await repository.get_receipt(session, receipt_id)
        if receipt is None:
            raise AppError(
                code="receipt_not_found",
                message="Không tìm thấy ảnh hóa đơn.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        expense = await repository.get_expense(session, receipt.expense_id)
        if expense is None:
            raise AppError(
                code="expense_not_found",
                message="Không tìm thấy khoản chi.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        await require_room_member(session, expense.room_id, user.id)
        return receipt

    @staticmethod
    async def scan_receipt(
        session: AsyncSession,
        user: AuthenticatedUser,
        receipt_id: UUID,
        *,
        force: bool = False,
    ) -> ExpenseReceipt:
        receipt = await repository.get_receipt(session, receipt_id, for_update=True)
        if receipt is None:
            raise AppError(
                code="receipt_not_found",
                message="Không tìm thấy ảnh hóa đơn.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        await _editable_expense(session, user, receipt.expense_id)
        if receipt.ocr_status == OcrStatus.COMPLETED and not force:
            return receipt
        if (
            receipt.ocr_status in {OcrStatus.PENDING, OcrStatus.PROCESSING}
            and not force
        ):
            raise AppError(
                code="ocr_already_processing",
                message="Ảnh hóa đơn này đang được quét.",
                status_code=status.HTTP_409_CONFLICT,
            )

        receipt.ocr_status = OcrStatus.PENDING
        receipt.ocr_data = None
        await session.commit()
        receipt.ocr_status = OcrStatus.PROCESSING
        await session.commit()

        try:
            image_content = await ExpenseService._download_receipt(receipt)
            receipt.ocr_data = await run_in_threadpool(
                process_receipt_image,
                image_content,
            )
        except AppError as error:
            await ExpenseService._mark_ocr_failed(session, receipt, error.message)
            raise
        except OcrUnavailableError as error:
            await ExpenseService._mark_ocr_failed(session, receipt, str(error))
            raise AppError(
                code="ocr_unavailable",
                message=str(error),
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            ) from error
        except OcrProcessingError as error:
            await ExpenseService._mark_ocr_failed(session, receipt, str(error))
            raise AppError(
                code="ocr_processing_failed",
                message=str(error),
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            ) from error

        receipt.ocr_status = OcrStatus.COMPLETED
        await session.commit()
        await session.refresh(receipt)
        return receipt

    @staticmethod
    async def _download_receipt(receipt: ExpenseReceipt) -> bytes:
        headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        }
        storage_url = (
            f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/authenticated/"
            f"{receipt.bucket}/{receipt.storage_path}"
        )
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.get(storage_url, headers=headers)
        except httpx.HTTPError as error:
            raise AppError(
                code="receipt_download_failed",
                message="Không thể kết nối Supabase Storage để tải ảnh hóa đơn.",
                status_code=status.HTTP_502_BAD_GATEWAY,
            ) from error
        if response.is_error:
            raise AppError(
                code="receipt_download_failed",
                message="Không thể tải ảnh hóa đơn từ Supabase Storage để quét.",
                status_code=status.HTTP_502_BAD_GATEWAY,
                details={"storage_status": response.status_code},
            )
        return response.content

    @staticmethod
    async def _mark_ocr_failed(
        session: AsyncSession,
        receipt: ExpenseReceipt,
        message: str,
    ) -> None:
        receipt.ocr_status = OcrStatus.FAILED
        receipt.ocr_data = {"error": {"message": message}}
        await session.commit()
        await session.refresh(receipt)
