from typing import Any
from src.users.schemas import UserProfileResponse, UserProfileUpdate


class UserService:
    """Service handling User profiles and settings."""

    @staticmethod
    async def get_user_profile(user_id: str) -> dict[str, Any]:
        return {
            "id": user_id,
            "name": "Trần Ngọc Huyên",
            "email": "trann@example.com",
            "bank_name": "MBBank",
            "account_number": "0988123456",
            "account_name": "TRAN NGOC HUYEN"
        }

    @staticmethod
    async def update_user_profile(user_id: str, data: UserProfileUpdate) -> dict[str, Any]:
        return {
            "status": "success",
            "message": "Cập nhật thông tin tài khoản thành công.",
            "data": data.model_dump(exclude_unset=True)
        }
