from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

from src.models import ExpenseStatus, SplitMethod

Money = Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=2)]
NonNegativeMoney = Annotated[Decimal, Field(ge=0, max_digits=14, decimal_places=2)]
PositiveShare = Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=4)]
ItemName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=160),
]


class ExpenseDraftCreate(BaseModel):
    title: ItemName
    total_amount: Money
    paid_by_member_id: UUID
    expense_date: date
    note: str | None = None


class ExpenseDraftUpdate(BaseModel):
    title: ItemName | None = None
    total_amount: Money | None = None
    paid_by_member_id: UUID | None = None
    expense_date: date | None = None
    note: str | None = None


class ExpenseItemCreate(BaseModel):
    name: ItemName
    quantity: Annotated[Decimal, Field(gt=0, max_digits=10, decimal_places=2)] = (
        Decimal(1)
    )
    unit_price: NonNegativeMoney
    category_id: UUID | None = None
    position: int = Field(default=0, ge=0)


class SplitParticipant(BaseModel):
    member_id: UUID
    share_value: Decimal | None = None


class SplitRequestBase(BaseModel):
    splits: Annotated[list[SplitParticipant], Field(min_length=1, max_length=20)]

    @model_validator(mode="after")
    def unique_members(self) -> "SplitRequestBase":
        member_ids = [split.member_id for split in self.splits]
        if len(member_ids) != len(set(member_ids)):
            raise ValueError("Một thành viên chỉ được xuất hiện một lần trong mỗi món.")
        return self


class EqualSplitRequest(SplitRequestBase):
    method: Literal[SplitMethod.EQUAL]


class ExactSplitRequest(SplitRequestBase):
    method: Literal[SplitMethod.EXACT]

    @model_validator(mode="after")
    def exact_values_required(self) -> "ExactSplitRequest":
        if any(
            split.share_value is None or split.share_value < 0 for split in self.splits
        ):
            raise ValueError("Chia chính xác cần số tiền không âm cho mọi thành viên.")
        return self


class PercentageSplitRequest(SplitRequestBase):
    method: Literal[SplitMethod.PERCENTAGE]

    @model_validator(mode="after")
    def percentage_values_required(self) -> "PercentageSplitRequest":
        if any(
            split.share_value is None or split.share_value < 0 for split in self.splits
        ):
            raise ValueError("Chia phần trăm cần tỷ lệ không âm cho mọi thành viên.")
        return self


class SharesSplitRequest(SplitRequestBase):
    method: Literal[SplitMethod.SHARES]

    @model_validator(mode="after")
    def positive_shares_required(self) -> "SharesSplitRequest":
        if any(
            split.share_value is None or split.share_value <= 0 for split in self.splits
        ):
            raise ValueError("Mỗi trọng số phải lớn hơn 0.")
        return self


SplitUpdate = Annotated[
    EqualSplitRequest | ExactSplitRequest | PercentageSplitRequest | SharesSplitRequest,
    Field(discriminator="method"),
]


class ExpenseSplitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    member_id: UUID
    split_method: SplitMethod
    share_value: Decimal | None
    amount_owed: Decimal


class ExpenseItemResponse(BaseModel):
    id: UUID
    name: str
    quantity: Decimal
    unit_price: Decimal
    total_amount: Decimal
    category_id: UUID | None
    position: int
    splits: list[ExpenseSplitResponse]


class ExpenseResponse(BaseModel):
    id: UUID
    room_id: UUID
    created_by_member_id: UUID
    paid_by_member_id: UUID
    title: str
    note: str | None
    total_amount: Decimal
    expense_date: date
    status: ExpenseStatus
    posted_at: datetime | None
    cancelled_at: datetime | None
    created_at: datetime
    updated_at: datetime
    items: list[ExpenseItemResponse]


class ExpenseReceiptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    expense_id: UUID
    bucket: str
    storage_path: str
    filename: str
    mime_type: str
    size_bytes: int
