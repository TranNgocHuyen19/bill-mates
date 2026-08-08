from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.exceptions import AppError
from src.users.dependencies import AuthenticatedUser
from src.users.models import PaymentAccount, Profile
from src.users.schemas import PaymentAccountCreate, UserProfileUpdate


def _display_name(user: AuthenticatedUser) -> str:
    metadata_name = user.user_metadata.get("name") or user.user_metadata.get("full_name")
    if isinstance(metadata_name, str) and metadata_name.strip():
        return metadata_name.strip()
    if user.email:
        return user.email.split("@", maxsplit=1)[0]
    return "Thành viên"


class UserService:
    @staticmethod
    async def get_or_create_profile(
        session: AsyncSession,
        user: AuthenticatedUser,
    ) -> Profile:
        profile = await session.get(Profile, user.id)
        if profile is not None:
            return profile

        if user.email is None:
            raise AppError(
                code="email_claim_required",
                message="Tài khoản Supabase chưa có email.",
                status_code=422,
            )

        profile = Profile(
            id=user.id,
            email=str(user.email),
            display_name=_display_name(user),
        )
        session.add(profile)
        await session.commit()
        await session.refresh(profile)
        return profile

    @staticmethod
    async def update_profile(
        session: AsyncSession,
        user: AuthenticatedUser,
        data: UserProfileUpdate,
    ) -> Profile:
        profile = await UserService.get_or_create_profile(session, user)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)
        await session.commit()
        await session.refresh(profile)
        return profile

    @staticmethod
    async def list_payment_accounts(
        session: AsyncSession,
        user: AuthenticatedUser,
    ) -> list[PaymentAccount]:
        await UserService.get_or_create_profile(session, user)
        result = await session.scalars(
            select(PaymentAccount)
            .where(PaymentAccount.profile_id == user.id)
            .order_by(PaymentAccount.is_default.desc(), PaymentAccount.created_at)
        )
        return list(result)

    @staticmethod
    async def create_payment_account(
        session: AsyncSession,
        user: AuthenticatedUser,
        data: PaymentAccountCreate,
    ) -> PaymentAccount:
        await UserService.get_or_create_profile(session, user)
        existing = await session.scalar(
            select(PaymentAccount.id)
            .where(PaymentAccount.profile_id == user.id)
            .limit(1)
        )
        should_be_default = data.is_default or existing is None
        if should_be_default:
            await session.execute(
                update(PaymentAccount)
                .where(PaymentAccount.profile_id == user.id)
                .values(is_default=False)
            )

        account = PaymentAccount(
            profile_id=user.id,
            **data.model_dump(exclude={"is_default"}),
            is_default=should_be_default,
        )
        session.add(account)
        await session.commit()
        await session.refresh(account)
        return account
