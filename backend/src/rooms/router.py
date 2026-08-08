from typing import Any
from fastapi import APIRouter, Depends
from src.rooms.schemas import RoomCreate, AddMemberInput
from src.rooms.service import RoomService
from src.users.dependencies import get_current_user

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("")
async def get_rooms(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Danh sách tất cả các phòng/nhóm người dùng tham gia."""
    user_id = current_user.get("sub", "user_101")
    rooms = await RoomService.get_user_rooms(user_id)
    return {"status": "success", "data": rooms}


@router.post("")
async def create_room(
    data: RoomCreate,
    current_user: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    """Tạo phòng/nhóm chi tiêu mới."""
    user_id = current_user.get("sub", "user_101")
    return await RoomService.create_room(data, user_id)


@router.get("/{room_id}")
async def get_room_detail(
    room_id: str,
    current_user: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    """Chi tiết phòng trọ & bảng tổng quan số dư thành viên."""
    room = await RoomService.get_room_detail(room_id)
    return {"status": "success", "data": room}


@router.post("/{room_id}/members")
async def add_member_to_room(
    room_id: str,
    data: AddMemberInput,
    current_user: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    """Mời thêm thành viên mới vào phòng."""
    return {
        "status": "success",
        "message": f"Đã gửi lời mời tham gia phòng {room_id} tới {data.email_or_phone}"
    }
