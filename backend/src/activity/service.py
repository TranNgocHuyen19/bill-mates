from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.activity import repository
from src.rooms.service import require_room_member
from src.users.dependencies import AuthenticatedUser


class ActivityService:
    @staticmethod
    async def list_activity(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        *,
        action: str | None,
        entity_type: str | None,
        limit: int,
        offset: int,
    ) -> list[dict[str, Any]]:
        await require_room_member(session, room_id, user.id)
        rows = await repository.list_activity(
            session,
            room_id,
            action=action,
            entity_type=entity_type,
            limit=limit,
            offset=offset,
        )
        return [
            {
                "id": activity.id,
                "room_id": activity.room_id,
                "actor_profile_id": activity.actor_profile_id,
                "actor_name": actor_name,
                "action": activity.action,
                "entity_type": activity.entity_type,
                "entity_id": activity.entity_id,
                "old_values": activity.old_values,
                "new_values": activity.new_values,
                "created_at": activity.created_at,
            }
            for activity, actor_name in rows
        ]
