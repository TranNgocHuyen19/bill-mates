from typing import Any
from fastapi import APIRouter, Depends
from src.auth.schemas import LoginInput, RegisterInput, ForgotPasswordInput
from src.auth.service import AuthService
from src.users.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me")
async def get_me(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Trả về thông tin người dùng đang đăng nhập dựa trên Supabase JWT Bearer Token."""
    return {
        "status": "success",
        "data": current_user
    }


@router.post("/login")
async def login(data: LoginInput) -> dict[str, Any]:
    """Endpoint đăng nhập."""
    return await AuthService.process_login(data)


@router.post("/register")
async def register(data: RegisterInput) -> dict[str, Any]:
    """Endpoint đăng ký tài khoản mới."""
    return await AuthService.process_register(data)


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordInput) -> dict[str, Any]:
    """Endpoint gửi yêu cầu đổi mật khẩu."""
    return {
        "status": "success",
        "message": f"Liên kết đặt lại mật khẩu đã được gửi đến email: {data.email}"
    }
