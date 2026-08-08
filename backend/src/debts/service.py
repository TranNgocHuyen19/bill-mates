from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import httpx
from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.activity.models import ActivityLog
from src.config import settings
from src.debts import repository
from src.debts.models import Settlement, SettlementReceipt
from src.debts.schemas import SettlementCreate
from src.exceptions import AppError
from src.expenses.models import Expense, ExpenseItem, ExpenseItemSplit
from src.models import (
    ExpenseStatus,
    MembershipStatus,
    SettlementStatus,
)
from src.rooms.models import RoomMember
from src.rooms.service import require_room_member
from src.users.dependencies import AuthenticatedUser
from src.users.models import PaymentAccount, Profile

ZERO = Decimal(0)
MAX_RECEIPT_BYTES = 10 * 1024 * 1024
ALLOWED_RECEIPT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def simplify_balances(
    balances: dict[UUID, Decimal],
) -> list[tuple[UUID, UUID, Decimal]]:
    debtors = [
        [member_id, -amount]
        for member_id, amount in sorted(balances.items(), key=lambda item: str(item[0]))
        if amount < ZERO
    ]
    creditors = [
        [member_id, amount]
        for member_id, amount in sorted(balances.items(), key=lambda item: str(item[0]))
        if amount > ZERO
    ]
    suggestions: list[tuple[UUID, UUID, Decimal]] = []
    debtor_index = 0
    creditor_index = 0

    while debtor_index < len(debtors) and creditor_index < len(creditors):
        debtor_id, debt = debtors[debtor_index]
        creditor_id, credit = creditors[creditor_index]
        amount = min(debt, credit)
        if amount > ZERO:
            suggestions.append((debtor_id, creditor_id, amount))
        debtors[debtor_index][1] -= amount
        creditors[creditor_index][1] -= amount
        if debtors[debtor_index][1] <= ZERO:
            debtor_index += 1
        if creditors[creditor_index][1] <= ZERO:
            creditor_index += 1

    return suggestions


async def _balance_data(
    session: AsyncSession,
    room_id: UUID,
) -> tuple[list[dict[str, Any]], dict[UUID, Decimal]]:
    member_rows = list(
        (
            await session.execute(
                select(RoomMember, Profile)
                .join(Profile, Profile.id == RoomMember.profile_id)
                .where(RoomMember.room_id == room_id)
                .order_by(RoomMember.created_at, RoomMember.id)
            )
        ).all()
    )
    amounts: dict[UUID, dict[str, Decimal]] = {
        member.id: {
            "paid": ZERO,
            "owed": ZERO,
            "settlements_sent": ZERO,
            "settlements_received": ZERO,
        }
        for member, _ in member_rows
    }

    paid_rows = (
        await session.execute(
            select(Expense.paid_by_member_id, Expense.total_amount).where(
                Expense.room_id == room_id,
                Expense.status == ExpenseStatus.POSTED,
            )
        )
    ).all()
    for member_id, amount in paid_rows:
        if member_id in amounts:
            amounts[member_id]["paid"] += amount

    owed_rows = (
        await session.execute(
            select(ExpenseItemSplit.member_id, ExpenseItemSplit.amount_owed)
            .join(
                ExpenseItem,
                ExpenseItem.id == ExpenseItemSplit.expense_item_id,
            )
            .join(Expense, Expense.id == ExpenseItem.expense_id)
            .where(
                Expense.room_id == room_id,
                Expense.status == ExpenseStatus.POSTED,
            )
        )
    ).all()
    for member_id, amount in owed_rows:
        if member_id in amounts:
            amounts[member_id]["owed"] += amount

    settlement_rows = (
        await session.execute(
            select(
                Settlement.from_member_id,
                Settlement.to_member_id,
                Settlement.amount,
            ).where(
                Settlement.room_id == room_id,
                Settlement.status == SettlementStatus.CONFIRMED,
            )
        )
    ).all()
    for from_member_id, to_member_id, amount in settlement_rows:
        if from_member_id in amounts:
            amounts[from_member_id]["settlements_sent"] += amount
        if to_member_id in amounts:
            amounts[to_member_id]["settlements_received"] += amount

    balances: dict[UUID, Decimal] = {}
    rows: list[dict[str, Any]] = []
    for member, profile in member_rows:
        values = amounts[member.id]
        balance = (
            values["paid"]
            - values["owed"]
            + values["settlements_sent"]
            - values["settlements_received"]
        )
        balances[member.id] = balance
        rows.append(
            {
                "member_id": member.id,
                "profile_id": member.profile_id,
                "display_name": member.nickname or profile.display_name,
                "balance": balance,
                **values,
            }
        )
    return rows, balances


async def _settlement_payload(
    session: AsyncSession,
    settlement: Settlement,
) -> dict[str, Any]:
    member_rows = (
        await session.execute(
            select(RoomMember.id, RoomMember.profile_id, Profile.display_name)
            .join(Profile, Profile.id == RoomMember.profile_id)
            .where(
                RoomMember.id.in_([settlement.from_member_id, settlement.to_member_id])
            )
        )
    ).all()
    members = {
        member_id: {"profile_id": profile_id, "name": display_name}
        for member_id, profile_id, display_name in member_rows
    }
    account = (
        await session.get(PaymentAccount, settlement.payment_account_id)
        if settlement.payment_account_id
        else None
    )
    return {
        "id": settlement.id,
        "room_id": settlement.room_id,
        "from_member_id": settlement.from_member_id,
        "from_name": members[settlement.from_member_id]["name"],
        "to_member_id": settlement.to_member_id,
        "to_name": members[settlement.to_member_id]["name"],
        "payment_account": account,
        "amount": settlement.amount,
        "method": settlement.method,
        "status": settlement.status,
        "reference": settlement.reference,
        "note": settlement.note,
        "rejection_reason": settlement.rejection_reason,
        "confirmed_at": settlement.confirmed_at,
        "created_at": settlement.created_at,
        "updated_at": settlement.updated_at,
    }


async def _get_actionable_settlement(
    session: AsyncSession,
    user: AuthenticatedUser,
    settlement_id: UUID,
) -> tuple[Settlement, RoomMember]:
    settlement = await repository.get_settlement(
        session,
        settlement_id,
        for_update=True,
    )
    if settlement is None:
        raise AppError(
            code="settlement_not_found",
            message="Không tìm thấy giao dịch thanh toán.",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    actor = await require_room_member(session, settlement.room_id, user.id)
    if settlement.status != SettlementStatus.PENDING:
        raise AppError(
            code="settlement_not_pending",
            message="Giao dịch này không còn chờ xác nhận.",
            status_code=status.HTTP_409_CONFLICT,
        )
    return settlement, actor


class DebtService:
    @staticmethod
    async def get_balances(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
    ) -> dict[str, Any]:
        actor = await require_room_member(session, room_id, user.id)
        rows, balances = await _balance_data(session, room_id)
        names = {row["member_id"]: row["display_name"] for row in rows}
        profile_ids = {row["member_id"]: row["profile_id"] for row in rows}
        default_accounts = {
            account.profile_id: account
            for account in await session.scalars(
                select(PaymentAccount).where(
                    PaymentAccount.profile_id.in_(profile_ids.values()),
                    PaymentAccount.is_default.is_(True),
                )
            )
        }
        suggestions = [
            {
                "from_member_id": from_member_id,
                "from_name": names[from_member_id],
                "to_member_id": to_member_id,
                "to_name": names[to_member_id],
                "amount": amount,
                "payment_account": default_accounts.get(profile_ids[to_member_id]),
            }
            for from_member_id, to_member_id, amount in simplify_balances(balances)
        ]
        return {
            "room_id": room_id,
            "current_member_id": actor.id,
            "current_balance": balances[actor.id],
            "total_to_pay": sum(
                (
                    suggestion["amount"]
                    for suggestion in suggestions
                    if suggestion["from_member_id"] == actor.id
                ),
                ZERO,
            ),
            "total_to_receive": sum(
                (
                    suggestion["amount"]
                    for suggestion in suggestions
                    if suggestion["to_member_id"] == actor.id
                ),
                ZERO,
            ),
            "balances": rows,
            "suggestions": suggestions,
        }

    @staticmethod
    async def list_settlements(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        *,
        settlement_status: SettlementStatus | None,
        limit: int,
        offset: int,
    ) -> list[dict[str, Any]]:
        await require_room_member(session, room_id, user.id)
        settlements = await repository.list_settlements(
            session,
            room_id,
            settlement_status=settlement_status,
            limit=limit,
            offset=offset,
        )
        return [
            await _settlement_payload(session, settlement) for settlement in settlements
        ]

    @staticmethod
    async def create_settlement(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        data: SettlementCreate,
    ) -> dict[str, Any]:
        actor = await require_room_member(session, room_id, user.id)
        recipient = await session.get(RoomMember, data.to_member_id)
        if (
            recipient is None
            or recipient.room_id != room_id
            or recipient.status != MembershipStatus.ACTIVE
            or recipient.id == actor.id
        ):
            raise AppError(
                code="invalid_settlement_recipient",
                message="Người nhận phải là thành viên đang hoạt động trong cùng phòng.",
                status_code=422,
            )

        _, balances = await _balance_data(session, room_id)
        pending_rows = (
            await session.execute(
                select(
                    Settlement.from_member_id,
                    Settlement.to_member_id,
                    Settlement.amount,
                ).where(
                    Settlement.room_id == room_id,
                    Settlement.status == SettlementStatus.PENDING,
                )
            )
        ).all()
        pending_sent = sum(
            (
                amount
                for from_member_id, _, amount in pending_rows
                if from_member_id == actor.id
            ),
            ZERO,
        )
        pending_received = sum(
            (
                amount
                for _, to_member_id, amount in pending_rows
                if to_member_id == recipient.id
            ),
            ZERO,
        )
        if (
            data.amount + pending_sent > -balances[actor.id]
            or data.amount + pending_received > balances[recipient.id]
        ):
            raise AppError(
                code="settlement_amount_exceeds_balance",
                message="Số tiền thanh toán vượt quá công nợ hiện tại.",
                status_code=422,
            )

        account = None
        if data.payment_account_id is not None:
            account = await session.get(PaymentAccount, data.payment_account_id)
            if account is None or account.profile_id != recipient.profile_id:
                raise AppError(
                    code="invalid_payment_account",
                    message="Tài khoản nhận tiền không thuộc người nhận.",
                    status_code=422,
                )
        elif data.method.value == "bank_transfer":
            account = await session.scalar(
                select(PaymentAccount)
                .where(
                    PaymentAccount.profile_id == recipient.profile_id,
                    PaymentAccount.is_default.is_(True),
                )
                .order_by(PaymentAccount.created_at)
            )

        settlement = Settlement(
            room_id=room_id,
            from_member_id=actor.id,
            to_member_id=recipient.id,
            payment_account_id=account.id if account else None,
            amount=data.amount,
            method=data.method,
            status=SettlementStatus.PENDING,
            reference=data.reference,
            note=data.note,
        )
        session.add(settlement)
        await session.flush()
        session.add(
            ActivityLog(
                room_id=room_id,
                actor_profile_id=user.id,
                action="settlement.created",
                entity_type="settlement",
                entity_id=settlement.id,
                new_values={
                    "amount": str(settlement.amount),
                    "status": settlement.status.value,
                },
            )
        )
        await session.commit()
        await session.refresh(settlement)
        return await _settlement_payload(session, settlement)

    @staticmethod
    async def confirm_settlement(
        session: AsyncSession,
        user: AuthenticatedUser,
        settlement_id: UUID,
    ) -> dict[str, Any]:
        settlement, actor = await _get_actionable_settlement(
            session,
            user,
            settlement_id,
        )
        if actor.id != settlement.to_member_id:
            raise AppError(
                code="settlement_confirm_denied",
                message="Chỉ người nhận tiền mới có thể xác nhận.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        _, balances = await _balance_data(session, settlement.room_id)
        if (
            settlement.amount > -balances[settlement.from_member_id]
            or settlement.amount > balances[settlement.to_member_id]
        ):
            raise AppError(
                code="settlement_balance_changed",
                message="Công nợ đã thay đổi, không thể xác nhận số tiền này.",
                status_code=status.HTTP_409_CONFLICT,
            )
        settlement.status = SettlementStatus.CONFIRMED
        settlement.confirmed_at = datetime.now(UTC)
        session.add(
            ActivityLog(
                room_id=settlement.room_id,
                actor_profile_id=user.id,
                action="settlement.confirmed",
                entity_type="settlement",
                entity_id=settlement.id,
                new_values={"status": SettlementStatus.CONFIRMED.value},
            )
        )
        await session.commit()
        await session.refresh(settlement)
        return await _settlement_payload(session, settlement)

    @staticmethod
    async def reject_settlement(
        session: AsyncSession,
        user: AuthenticatedUser,
        settlement_id: UUID,
        reason: str,
    ) -> dict[str, Any]:
        settlement, actor = await _get_actionable_settlement(
            session,
            user,
            settlement_id,
        )
        if actor.id != settlement.to_member_id:
            raise AppError(
                code="settlement_reject_denied",
                message="Chỉ người nhận tiền mới có thể từ chối.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        settlement.status = SettlementStatus.REJECTED
        settlement.rejection_reason = reason
        session.add(
            ActivityLog(
                room_id=settlement.room_id,
                actor_profile_id=user.id,
                action="settlement.rejected",
                entity_type="settlement",
                entity_id=settlement.id,
                new_values={
                    "status": SettlementStatus.REJECTED.value,
                    "reason": reason,
                },
            )
        )
        await session.commit()
        await session.refresh(settlement)
        return await _settlement_payload(session, settlement)

    @staticmethod
    async def cancel_settlement(
        session: AsyncSession,
        user: AuthenticatedUser,
        settlement_id: UUID,
    ) -> None:
        settlement, actor = await _get_actionable_settlement(
            session,
            user,
            settlement_id,
        )
        if actor.id != settlement.from_member_id:
            raise AppError(
                code="settlement_cancel_denied",
                message="Chỉ người gửi mới có thể hủy giao dịch.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        settlement.status = SettlementStatus.CANCELLED
        session.add(
            ActivityLog(
                room_id=settlement.room_id,
                actor_profile_id=user.id,
                action="settlement.cancelled",
                entity_type="settlement",
                entity_id=settlement.id,
                new_values={"status": SettlementStatus.CANCELLED.value},
            )
        )
        await session.commit()

    @staticmethod
    async def upload_receipt(
        session: AsyncSession,
        user: AuthenticatedUser,
        settlement_id: UUID,
        *,
        filename: str,
        mime_type: str,
        content: bytes,
    ) -> SettlementReceipt:
        settlement = await repository.get_settlement(session, settlement_id)
        if settlement is None:
            raise AppError(
                code="settlement_not_found",
                message="Không tìm thấy giao dịch thanh toán.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        actor = await require_room_member(session, settlement.room_id, user.id)
        if actor.id != settlement.from_member_id:
            raise AppError(
                code="settlement_receipt_denied",
                message="Chỉ người gửi tiền mới có thể tải minh chứng.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        if mime_type not in ALLOWED_RECEIPT_TYPES:
            raise AppError(
                code="receipt_type_not_allowed",
                message="Ảnh minh chứng phải là JPEG, PNG hoặc WebP.",
                status_code=422,
            )
        if not content or len(content) > MAX_RECEIPT_BYTES:
            raise AppError(
                code="receipt_size_invalid",
                message="Ảnh minh chứng phải nhỏ hơn 10 MB.",
                status_code=422,
            )

        extension = Path(filename).suffix.lower() or ".jpg"
        storage_path = (
            f"rooms/{settlement.room_id}/settlements/"
            f"{settlement.id}/{uuid4()}{extension}"
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
                f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/"
                f"{bucket}/{storage_path}",
                headers=headers,
                content=content,
            )
        if response.is_error:
            raise AppError(
                code="receipt_upload_failed",
                message="Không thể lưu minh chứng vào Supabase Storage.",
                status_code=status.HTTP_502_BAD_GATEWAY,
                details={"storage_status": response.status_code},
            )

        receipt = SettlementReceipt(
            settlement_id=settlement.id,
            bucket=bucket,
            storage_path=storage_path,
            filename=filename,
            mime_type=mime_type,
            size_bytes=len(content),
        )
        session.add(receipt)
        await session.commit()
        await session.refresh(receipt)
        return receipt
