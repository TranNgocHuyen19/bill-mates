from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.models import (
    Base,
    ExpenseStatus,
    OcrStatus,
    SplitMethod,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
    enum_values,
)


class Expense(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "expenses"
    __table_args__ = (
        CheckConstraint("total_amount > 0", name="total_amount_positive"),
        Index("expenses_room_id_expense_date_idx", "room_id", "expense_date"),
        Index("expenses_status_idx", "status"),
    )

    room_id: Mapped[UUID] = mapped_column(
        ForeignKey("rooms.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_by_member_id: Mapped[UUID] = mapped_column(
        ForeignKey("room_members.id", ondelete="RESTRICT"),
        nullable=False,
    )
    paid_by_member_id: Mapped[UUID] = mapped_column(
        ForeignKey("room_members.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[ExpenseStatus] = mapped_column(
        Enum(
            ExpenseStatus,
            name="expense_status",
            values_callable=enum_values,
            validate_strings=True,
        ),
        nullable=False,
        default=ExpenseStatus.DRAFT,
    )
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ExpenseItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "expense_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="quantity_positive"),
        CheckConstraint("unit_price >= 0", name="unit_price_non_negative"),
        CheckConstraint("total_amount > 0", name="total_amount_positive"),
    )

    expense_id: Mapped[UUID] = mapped_column(
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"),
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ExpenseItemSplit(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "expense_item_splits"
    __table_args__ = (
        UniqueConstraint("expense_item_id", "member_id"),
        CheckConstraint("amount_owed >= 0", name="amount_owed_non_negative"),
        CheckConstraint(
            "share_value IS NULL OR share_value >= 0",
            name="share_value_non_negative",
        ),
    )

    expense_item_id: Mapped[UUID] = mapped_column(
        ForeignKey("expense_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    member_id: Mapped[UUID] = mapped_column(
        ForeignKey("room_members.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    split_method: Mapped[SplitMethod] = mapped_column(
        Enum(
            SplitMethod,
            name="split_method",
            values_callable=enum_values,
            validate_strings=True,
        ),
        nullable=False,
    )
    share_value: Mapped[Decimal | None] = mapped_column(Numeric(14, 4))
    amount_owed: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)


class ExpenseReceipt(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "expense_receipts"
    __table_args__ = (
        CheckConstraint("size_bytes > 0", name="size_bytes_positive"),
    )

    expense_id: Mapped[UUID] = mapped_column(
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    bucket: Mapped[str] = mapped_column(String(80), nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    ocr_status: Mapped[OcrStatus] = mapped_column(
        Enum(
            OcrStatus,
            name="ocr_status",
            values_callable=enum_values,
            validate_strings=True,
        ),
        nullable=False,
        default=OcrStatus.NOT_REQUESTED,
    )
    ocr_data: Mapped[dict[str, Any] | None] = mapped_column(JSON)
