from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.users.dependencies import CurrentUser
from src.users.schemas import (
    PaymentAccountCreate,
    PaymentAccountResponse,
    UserProfileResponse,
    UserProfileUpdate,
)
from src.users.service import UserService

router = APIRouter(tags=["Users"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/me", response_model=UserProfileResponse)
@router.get("/users/me", response_model=UserProfileResponse, include_in_schema=False)
async def get_my_profile(
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await UserService.get_or_create_profile(session, current_user)


@router.patch("/me", response_model=UserProfileResponse)
@router.put("/users/me", response_model=UserProfileResponse, include_in_schema=False)
async def update_my_profile(
    data: UserProfileUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await UserService.update_profile(session, current_user, data)


@router.get("/me/payment-accounts", response_model=list[PaymentAccountResponse])
async def list_payment_accounts(
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await UserService.list_payment_accounts(session, current_user)


@router.post(
    "/me/payment-accounts",
    response_model=PaymentAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_payment_account(
    data: PaymentAccountCreate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await UserService.create_payment_account(session, current_user, data)
