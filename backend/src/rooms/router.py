from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.rooms.schemas import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    InviteCreate,
    InviteResponse,
    MemberRoleUpdate,
    RoomCreate,
    RoomDetail,
    RoomMemberResponse,
    RoomSummary,
    RoomUpdate,
)
from src.rooms.service import RoomService
from src.users.dependencies import CurrentUser

router = APIRouter(tags=["Rooms"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/rooms", response_model=list[RoomSummary])
async def list_rooms(
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await RoomService.list_rooms(session, current_user)


@router.post(
    "/rooms",
    response_model=RoomSummary,
    status_code=status.HTTP_201_CREATED,
)
async def create_room(
    data: RoomCreate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await RoomService.create_room(session, current_user, data)


@router.get("/rooms/{room_id}", response_model=RoomDetail)
async def get_room_detail(
    room_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await RoomService.get_room_detail(session, current_user, room_id)


@router.patch("/rooms/{room_id}", response_model=RoomDetail)
async def update_room(
    room_id: UUID,
    data: RoomUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await RoomService.update_room(session, current_user, room_id, data)


@router.post("/rooms/{room_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
async def archive_room(
    room_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> Response:
    await RoomService.archive_room(session, current_user, room_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/rooms/{room_id}/members", response_model=list[RoomMemberResponse])
async def list_members(
    room_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    detail = await RoomService.get_room_detail(session, current_user, room_id)
    return detail.members


@router.post(
    "/rooms/{room_id}/invites",
    response_model=InviteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_invite(
    room_id: UUID,
    data: InviteCreate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await RoomService.create_invite(session, current_user, room_id, data)


@router.post("/invites/{token}/join", status_code=status.HTTP_200_OK)
async def join_room(
    token: str,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> dict[str, str]:
    membership = await RoomService.join_room(session, current_user, token)
    return {
        "room_id": str(membership.room_id),
        "member_id": str(membership.id),
        "status": membership.status.value,
    }


@router.patch(
    "/rooms/{room_id}/members/{member_id}/role",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def update_member_role(
    room_id: UUID,
    member_id: UUID,
    data: MemberRoleUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> Response:
    await RoomService.update_member_role(
        session, current_user, room_id, member_id, data
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/rooms/{room_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_room(
    room_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> Response:
    await RoomService.leave_room(session, current_user, room_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/rooms/{room_id}/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_member(
    room_id: UUID,
    member_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> Response:
    await RoomService.remove_member(session, current_user, room_id, member_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/rooms/{room_id}/categories", response_model=list[CategoryResponse])
async def list_categories(
    room_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await RoomService.list_categories(session, current_user, room_id)


@router.post(
    "/rooms/{room_id}/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    room_id: UUID,
    data: CategoryCreate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await RoomService.create_category(session, current_user, room_id, data)


@router.patch(
    "/rooms/{room_id}/categories/{category_id}",
    response_model=CategoryResponse,
)
async def update_category(
    room_id: UUID,
    category_id: UUID,
    data: CategoryUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await RoomService.update_category(
        session,
        current_user,
        room_id,
        category_id,
        data,
    )
