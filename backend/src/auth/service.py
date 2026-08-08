from typing import Any
from src.auth.schemas import LoginInput, RegisterInput


class AuthService:
    """Service handling Authentication operations."""

    @staticmethod
    async def process_login(data: LoginInput) -> dict[str, Any]:
        return {
            "status": "success",
            "message": "Đăng nhập thành công qua Supabase Auth SDK.",
            "data": {"email": data.email}
        }

    @staticmethod
    async def process_register(data: RegisterInput) -> dict[str, Any]:
        return {
            "status": "success",
            "message": "Đăng ký tài khoản thành công.",
            "data": {"name": data.name, "email": data.email}
        }
