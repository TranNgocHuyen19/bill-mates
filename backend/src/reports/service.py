from collections import defaultdict
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from src.exceptions import AppError
from src.models import MembershipStatus
from src.reports import repository
from src.reports.schemas import RoomReport
from src.rooms.models import Room
from src.rooms.service import require_room_member
from src.users.dependencies import AuthenticatedUser

REPORT_TIMEZONE = "Asia/Bangkok"
UNCATEGORIZED = "Chưa phân loại"
ZERO = Decimal(0)


def _utc_bounds(from_date: date, to_date: date) -> tuple[datetime, datetime]:
    timezone = ZoneInfo(REPORT_TIMEZONE)
    start_at = datetime.combine(from_date, time.min, timezone).astimezone(UTC)
    end_at = datetime.combine(
        to_date + timedelta(days=1),
        time.min,
        timezone,
    ).astimezone(UTC)
    return start_at, end_at


class ReportService:
    @staticmethod
    async def get_report(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        from_date: date,
        to_date: date,
    ) -> RoomReport:
        if from_date > to_date:
            raise AppError(
                code="invalid_report_range",
                message="Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.",
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        await require_room_member(session, room_id, user.id)
        room = await session.get(Room, room_id)
        if room is None:
            raise AppError(
                code="room_not_found",
                message="Không tìm thấy phòng.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        start_at, end_at = _utc_bounds(from_date, to_date)
        member_rows = await repository.list_member_rows(session, room_id)
        expense_rows = await repository.list_expense_rows(
            session,
            room_id,
            from_date,
            to_date,
        )
        expense_ids = [expense.id for expense, _, _ in expense_rows]
        item_rows = await repository.list_item_rows(session, expense_ids)
        item_ids = [item.id for item, _, _ in item_rows]
        split_rows = await repository.list_split_rows(session, item_ids)
        settlement_rows = await repository.list_settlement_rows(
            session,
            room_id,
            start_at,
            end_at,
        )
        confirmed_rows = await repository.list_confirmed_settlements(
            session,
            room_id,
            start_at,
            end_at,
        )

        names = {
            member.id: member.nickname or profile.display_name
            for member, profile in member_rows
        }
        monthly: dict[str, dict[str, Decimal | int]] = defaultdict(
            lambda: {"expense_count": 0, "total": ZERO}
        )
        categories: dict[UUID | None, dict[str, Any]] = {}
        members: dict[UUID, dict[str, Decimal]] = {
            member.id: {
                "paid": ZERO,
                "owed": ZERO,
                "settlements_sent": ZERO,
                "settlements_received": ZERO,
            }
            for member, _ in member_rows
        }

        expenses = []
        for expense, payer, payer_profile in expense_rows:
            month = expense.expense_date.strftime("%Y-%m")
            monthly[month]["expense_count"] += 1
            monthly[month]["total"] += expense.total_amount
            members[payer.id]["paid"] += expense.total_amount
            payer_name = payer.nickname or payer_profile.display_name
            expenses.append(
                {
                    "expense_id": expense.id,
                    "expense_date": expense.expense_date,
                    "title": expense.title,
                    "payer_member_id": payer.id,
                    "payer_name": payer_name,
                    "total": expense.total_amount,
                    "note": expense.note,
                    "posted_at": expense.posted_at,
                }
            )

        items = []
        for item, expense, category in item_rows:
            category_key = category.id if category else None
            category_data = categories.setdefault(
                category_key,
                {
                    "category_id": category_key,
                    "name": category.name if category else UNCATEGORIZED,
                    "color": category.color if category else None,
                    "total": ZERO,
                },
            )
            category_data["total"] += item.total_amount
            items.append(
                {
                    "expense_id": expense.id,
                    "expense_date": expense.expense_date,
                    "item_id": item.id,
                    "position": item.position,
                    "name": item.name,
                    "category_id": category_key,
                    "category_name": category_data["name"],
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total": item.total_amount,
                }
            )

        expense_by_item = {item.id: expense for item, expense, _ in item_rows}
        splits = []
        for split, item, member, profile in split_rows:
            members[member.id]["owed"] += split.amount_owed
            splits.append(
                {
                    "expense_id": expense_by_item[item.id].id,
                    "item_id": item.id,
                    "item_name": item.name,
                    "member_id": member.id,
                    "member_name": member.nickname or profile.display_name,
                    "split_method": split.split_method,
                    "share_value": split.share_value,
                    "amount_owed": split.amount_owed,
                }
            )

        for settlement in confirmed_rows:
            members[settlement.from_member_id]["settlements_sent"] += settlement.amount
            members[settlement.to_member_id]["settlements_received"] += (
                settlement.amount
            )

        member_reports = []
        for member, _ in member_rows:
            values = members[member.id]
            balance = (
                values["paid"]
                - values["owed"]
                + values["settlements_sent"]
                - values["settlements_received"]
            )
            member_reports.append(
                {
                    "member_id": member.id,
                    "display_name": names[member.id],
                    **values,
                    "balance": balance,
                }
            )

        settlements = [
            {
                "settlement_id": settlement.id,
                "created_at": settlement.created_at,
                "confirmed_at": settlement.confirmed_at,
                "from_member_id": settlement.from_member_id,
                "from_name": names[settlement.from_member_id],
                "to_member_id": settlement.to_member_id,
                "to_name": names[settlement.to_member_id],
                "amount": settlement.amount,
                "method": settlement.method,
                "status": settlement.status,
                "reference": settlement.reference,
                "note": settlement.note,
            }
            for settlement in settlement_rows
        ]
        total_expenses = sum(
            (expense.total_amount for expense, _, _ in expense_rows),
            ZERO,
        )

        return RoomReport(
            room_id=room.id,
            room_name=room.name,
            currency=room.currency,
            from_date=from_date,
            to_date=to_date,
            timezone=REPORT_TIMEZONE,
            generated_at=datetime.now(UTC),
            summary={
                "posted_expense_count": len(expense_rows),
                "total_expenses": total_expenses,
                "member_count": sum(
                    member.status == MembershipStatus.ACTIVE
                    for member, _ in member_rows
                ),
                "confirmed_settlement_count": len(confirmed_rows),
                "confirmed_settlement_amount": sum(
                    (settlement.amount for settlement in confirmed_rows),
                    ZERO,
                ),
            },
            monthly=[{"month": month, **monthly[month]} for month in sorted(monthly)],
            categories=sorted(
                categories.values(),
                key=lambda item: (
                    -item["total"],
                    item["name"],
                    str(item["category_id"]),
                ),
            ),
            members=member_reports,
            expenses=expenses,
            items=items,
            splits=splits,
            settlements=settlements,
        )
