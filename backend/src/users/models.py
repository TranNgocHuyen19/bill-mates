from uuid import UUID

from sqlalchemy import Boolean, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.models import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Profile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "profiles"
    __table_args__ = (UniqueConstraint("email"),)

    email: Mapped[str] = mapped_column(String(320), nullable=False)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32))
    avatar_path: Mapped[str | None] = mapped_column(Text)


class PaymentAccount(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payment_accounts"

    profile_id: Mapped[UUID] = mapped_column(
        __import__("sqlalchemy").ForeignKey("profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    label: Mapped[str] = mapped_column(String(80), nullable=False)
    method: Mapped[str] = mapped_column(String(32), nullable=False)
    bank_code: Mapped[str | None] = mapped_column(String(32))
    bank_name: Mapped[str | None] = mapped_column(String(128))
    account_number: Mapped[str | None] = mapped_column(String(64))
    account_name: Mapped[str | None] = mapped_column(String(128))
    wallet_provider: Mapped[str | None] = mapped_column(String(64))
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
