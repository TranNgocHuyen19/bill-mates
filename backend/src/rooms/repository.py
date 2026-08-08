from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.expenses.models import Expense
from src.models import ExpenseStatus, MembershipStatus
from src.rooms.models import Category, Room, RoomInvite, RoomMember
from src.users.models import Profile


async def get_membership(
    session: AsyncSession,
    room_id: UUID,
    profile_id: UUID,
) -> RoomMember | None:
    return await session.scalar(
        select(RoomMember).where(
            RoomMember.room_id == room_id,
            RoomMember.profile_id == profile_id,
        )
    )


async def get_room(session: AsyncSession, room_id: UUID) -> Room | None:
    return await session.get(Room, room_id)


async def list_room_rows(
    session: AsyncSession,
    profile_id: UUID,
) -> list[tuple[Room, RoomMember, int, Decimal]]:
    member_count = (
        select(func.count(RoomMember.id))
        .where(
            RoomMember.room_id == Room.id,
            RoomMember.status == MembershipStatus.ACTIVE,
        )
        .correlate(Room)
        .scalar_subquery()
    )
    total_expenses = (
        select(func.coalesce(func.sum(Expense.total_amount), 0))
        .where(
            Expense.room_id == Room.id,
            Expense.status == ExpenseStatus.POSTED,
        )
        .correlate(Room)
        .scalar_subquery()
    )
    result = await session.execute(
        select(Room, RoomMember, member_count, total_expenses)
        .join(RoomMember, RoomMember.room_id == Room.id)
        .where(
            RoomMember.profile_id == profile_id,
            RoomMember.status == MembershipStatus.ACTIVE,
        )
        .order_by(Room.archived_at.is_not(None), Room.updated_at.desc())
    )
    return list(result.tuples())


async def list_member_rows(
    session: AsyncSession,
    room_id: UUID,
) -> list[tuple[RoomMember, Profile]]:
    result = await session.execute(
        select(RoomMember, Profile)
        .join(Profile, Profile.id == RoomMember.profile_id)
        .where(RoomMember.room_id == room_id)
        .order_by(RoomMember.role, Profile.display_name)
    )
    return list(result.tuples())


async def get_invite_for_update(
    session: AsyncSession,
    token: str,
) -> RoomInvite | None:
    return await session.scalar(
        select(RoomInvite).where(RoomInvite.token == token).with_for_update()
    )


async def list_categories(
    session: AsyncSession,
    room_id: UUID,
) -> list[Category]:
    result = await session.scalars(
        select(Category)
        .where(Category.room_id == room_id)
        .order_by(Category.is_active.desc(), Category.name)
    )
    return list(result)
