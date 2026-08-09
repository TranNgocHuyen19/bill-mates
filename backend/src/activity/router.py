from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.activity.schemas import ActivityResponse
from src.activity.service import ActivityService
from src.database import get_db
from src.users.dependencies import CurrentUser

router = APIRouter(tags=["Activity"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "/rooms/{room_id}/activity",
    response_model=list[ActivityResponse],
)
async def list_room_activity(
    room_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
    action: Annotated[str | None, Query(max_length=80)] = None,
    entity_type: Annotated[str | None, Query(max_length=80)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> object:
    return await ActivityService.list_activity(
        session,
        current_user,
        room_id,
        action=action,
        entity_type=entity_type,
        limit=limit,
        offset=offset,
    )
