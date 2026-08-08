from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.models import (
    Base,
    SettlementMethod,
    SettlementStatus,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
    enum_values,
)


class Settlement(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "settlements"
    __table_args__ = (
        CheckConstraint("amount > 0", name="amount_positive"),
        CheckConstraint("from_member_id <> to_member_id", name="members_different"),
        Index("settlements_room_id_created_at_idx", "room_id", "created_at"),
        Index("settlements_status_idx", "status"),
    )

    room_id: Mapped[UUID] = mapped_column(
        ForeignKey("rooms.id", ondelete="RESTRICT"),
        nullable=False,
    )
    from_member_id: Mapped[UUID] = mapped_column(
        ForeignKey("room_members.id", ondelete="RESTRICT"),
        nullable=False,
    )
    to_member_id: Mapped[UUID] = mapped_column(
        ForeignKey("room_members.id", ondelete="RESTRICT"),
        nullable=False,
    )
    payment_account_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("payment_accounts.id", ondelete="SET NULL"),
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    method: Mapped[SettlementMethod] = mapped_column(
        Enum(
            SettlementMethod,
            name="settlement_method",
            values_callable=enum_values,
            validate_strings=True,
        ),
        nullable=False,
    )
    status: Mapped[SettlementStatus] = mapped_column(
        Enum(
            SettlementStatus,
            name="settlement_status",
            values_callable=enum_values,
            validate_strings=True,
        ),
        nullable=False,
        default=SettlementStatus.PENDING,
    )
    reference: Mapped[str | None] = mapped_column(String(128))
    note: Mapped[str | None] = mapped_column(Text)
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SettlementReceipt(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "settlement_receipts"
    __table_args__ = (
        CheckConstraint("size_bytes > 0", name="size_bytes_positive"),
    )

    settlement_id: Mapped[UUID] = mapped_column(
        ForeignKey("settlements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    bucket: Mapped[str] = mapped_column(String(80), nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
