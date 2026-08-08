from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.debts.models import Settlement
from src.models import SettlementStatus


async def get_settlement(
    session: AsyncSession,
    settlement_id: UUID,
    *,
    for_update: bool = False,
) -> Settlement | None:
    statement: Select[tuple[Settlement]] = select(Settlement).where(
        Settlement.id == settlement_id
    )
    if for_update:
        statement = statement.with_for_update()
    return await session.scalar(statement)


async def list_settlements(
    session: AsyncSession,
    room_id: UUID,
    *,
    settlement_status: SettlementStatus | None,
    limit: int,
    offset: int,
) -> list[Settlement]:
    statement = (
        select(Settlement)
        .where(Settlement.room_id == room_id)
        .order_by(Settlement.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if settlement_status is not None:
        statement = statement.where(Settlement.status == settlement_status)
    return list(await session.scalars(statement))
