from fastapi import APIRouter

from src.users.dependencies import AuthenticatedUser, CurrentUser

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me", response_model=AuthenticatedUser)
async def get_authenticated_user(current_user: CurrentUser) -> AuthenticatedUser:
    return current_user
