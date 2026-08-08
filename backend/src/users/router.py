from typing import Any
from fastapi import APIRouter, Depends
from src.users.schemas import UserProfileResponse, UserProfileUpdate
from src.users.service import UserService
from src.users.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_my_profile(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Lấy thông tin hồ sơ của người dùng hiện tại."""
    user_id = current_user.get("sub", "user_101")
    profile = await UserService.get_user_profile(user_id)
    return {"status": "success", "data": profile}


@router.put("/me")
async def update_my_profile(
    data: UserProfileUpdate,
    current_user: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    """Cập nhật thông tin hồ sơ và tài khoản ngân hàng."""
    user_id = current_user.get("sub", "user_101")
    return await UserService.update_user_profile(user_id, data)
