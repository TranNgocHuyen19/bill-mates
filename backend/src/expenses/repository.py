from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.expenses.models import Expense, ExpenseItem, ExpenseItemSplit
from src.models import ExpenseStatus


async def get_expense(
    session: AsyncSession,
    expense_id: UUID,
    *,
    for_update: bool = False,
) -> Expense | None:
    query = select(Expense).where(Expense.id == expense_id)
    if for_update:
        query = query.with_for_update()
    return await session.scalar(query)


async def list_expenses(
    session: AsyncSession,
    room_id: UUID,
    *,
    expense_status: ExpenseStatus | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Expense]:
    query = select(Expense).where(Expense.room_id == room_id)
    if expense_status is not None:
        query = query.where(Expense.status == expense_status)
    result = await session.scalars(
        query.order_by(Expense.expense_date.desc(), Expense.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result)


async def list_items(
    session: AsyncSession,
    expense_id: UUID,
) -> list[ExpenseItem]:
    result = await session.scalars(
        select(ExpenseItem)
        .where(ExpenseItem.expense_id == expense_id)
        .order_by(ExpenseItem.position, ExpenseItem.created_at)
    )
    return list(result)


async def list_splits(
    session: AsyncSession,
    item_ids: list[UUID],
) -> list[ExpenseItemSplit]:
    if not item_ids:
        return []
    result = await session.scalars(
        select(ExpenseItemSplit)
        .where(ExpenseItemSplit.expense_item_id.in_(item_ids))
        .order_by(ExpenseItemSplit.member_id)
    )
    return list(result)


async def replace_splits(
    session: AsyncSession,
    item_id: UUID,
    splits: list[ExpenseItemSplit],
) -> None:
    await session.execute(
        delete(ExpenseItemSplit).where(ExpenseItemSplit.expense_item_id == item_id)
    )
    session.add_all(splits)
