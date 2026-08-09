from datetime import date, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.debts.models import Settlement
from src.expenses.models import Expense, ExpenseItem, ExpenseItemSplit
from src.models import ExpenseStatus, SettlementStatus
from src.rooms.models import Category, RoomMember
from src.users.models import Profile


async def list_member_rows(
    session: AsyncSession,
    room_id: UUID,
) -> list[tuple[RoomMember, Profile]]:
    result = await session.execute(
        select(RoomMember, Profile)
        .join(Profile, Profile.id == RoomMember.profile_id)
        .where(RoomMember.room_id == room_id)
        .order_by(RoomMember.created_at, RoomMember.id)
    )
    return list(result.all())


async def list_expense_rows(
    session: AsyncSession,
    room_id: UUID,
    from_date: date,
    to_date: date,
) -> list[tuple[Expense, RoomMember, Profile]]:
    result = await session.execute(
        select(Expense, RoomMember, Profile)
        .join(RoomMember, RoomMember.id == Expense.paid_by_member_id)
        .join(Profile, Profile.id == RoomMember.profile_id)
        .where(
            Expense.room_id == room_id,
            Expense.status == ExpenseStatus.POSTED,
            Expense.expense_date >= from_date,
            Expense.expense_date <= to_date,
        )
        .order_by(Expense.expense_date, Expense.created_at, Expense.id)
    )
    return list(result.all())


async def list_item_rows(
    session: AsyncSession,
    expense_ids: list[UUID],
) -> list[tuple[ExpenseItem, Expense, Category | None]]:
    if not expense_ids:
        return []
    result = await session.execute(
        select(ExpenseItem, Expense, Category)
        .join(Expense, Expense.id == ExpenseItem.expense_id)
        .outerjoin(Category, Category.id == ExpenseItem.category_id)
        .where(ExpenseItem.expense_id.in_(expense_ids))
        .order_by(
            Expense.expense_date,
            Expense.created_at,
            ExpenseItem.position,
            ExpenseItem.id,
        )
    )
    return list(result.all())


async def list_split_rows(
    session: AsyncSession,
    item_ids: list[UUID],
) -> list[tuple[ExpenseItemSplit, ExpenseItem, RoomMember, Profile]]:
    if not item_ids:
        return []
    result = await session.execute(
        select(ExpenseItemSplit, ExpenseItem, RoomMember, Profile)
        .join(ExpenseItem, ExpenseItem.id == ExpenseItemSplit.expense_item_id)
        .join(RoomMember, RoomMember.id == ExpenseItemSplit.member_id)
        .join(Profile, Profile.id == RoomMember.profile_id)
        .where(ExpenseItemSplit.expense_item_id.in_(item_ids))
        .order_by(
            ExpenseItem.expense_id,
            ExpenseItem.position,
            RoomMember.created_at,
            RoomMember.id,
        )
    )
    return list(result.all())


async def list_settlement_rows(
    session: AsyncSession,
    room_id: UUID,
    start_at: datetime,
    end_at: datetime,
) -> list[Settlement]:
    return list(
        await session.scalars(
            select(Settlement)
            .where(
                Settlement.room_id == room_id,
                Settlement.created_at >= start_at,
                Settlement.created_at < end_at,
            )
            .order_by(Settlement.created_at, Settlement.id)
        )
    )


async def list_confirmed_settlements(
    session: AsyncSession,
    room_id: UUID,
    start_at: datetime,
    end_at: datetime,
) -> list[Settlement]:
    return list(
        await session.scalars(
            select(Settlement)
            .where(
                Settlement.room_id == room_id,
                Settlement.status == SettlementStatus.CONFIRMED,
                Settlement.confirmed_at.is_not(None),
                Settlement.confirmed_at >= start_at,
                Settlement.confirmed_at < end_at,
            )
            .order_by(Settlement.confirmed_at, Settlement.id)
        )
    )
