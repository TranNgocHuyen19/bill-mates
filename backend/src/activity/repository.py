from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.activity.models import ActivityLog
from src.users.models import Profile


async def list_activity(
    session: AsyncSession,
    room_id: UUID,
    *,
    action: str | None,
    entity_type: str | None,
    limit: int,
    offset: int,
) -> list[tuple[ActivityLog, str | None]]:
    statement = (
        select(ActivityLog, Profile.display_name)
        .outerjoin(Profile, Profile.id == ActivityLog.actor_profile_id)
        .where(ActivityLog.room_id == room_id)
        .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
        .limit(limit)
        .offset(offset)
    )
    if action is not None:
        statement = statement.where(ActivityLog.action == action)
    if entity_type is not None:
        statement = statement.where(ActivityLog.entity_type == entity_type)
    return list((await session.execute(statement)).all())
