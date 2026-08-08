from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.models import SettlementMethod, SettlementStatus

Money = Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=2)]


class MemberBalance(BaseModel):
    member_id: UUID
    profile_id: UUID
    display_name: str
    balance: Decimal
    paid: Decimal
    owed: Decimal
    settlements_sent: Decimal
    settlements_received: Decimal


class PaymentAccountSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    label: str
    method: str
    bank_code: str | None
    bank_name: str | None
    account_number: str | None
    account_name: str | None
    wallet_provider: str | None


class SettlementSuggestion(BaseModel):
    from_member_id: UUID
    from_name: str
    to_member_id: UUID
    to_name: str
    amount: Decimal
    payment_account: PaymentAccountSummary | None


class BalanceSummary(BaseModel):
    room_id: UUID
    current_member_id: UUID
    current_balance: Decimal
    total_to_pay: Decimal
    total_to_receive: Decimal
    balances: list[MemberBalance]
    suggestions: list[SettlementSuggestion]


class SettlementCreate(BaseModel):
    to_member_id: UUID
    amount: Money
    method: SettlementMethod = SettlementMethod.BANK_TRANSFER
    payment_account_id: UUID | None = None
    reference: str | None = Field(default=None, max_length=128)
    note: str | None = None


class SettlementReject(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


class SettlementResponse(BaseModel):
    id: UUID
    room_id: UUID
    from_member_id: UUID
    from_name: str
    to_member_id: UUID
    to_name: str
    payment_account: PaymentAccountSummary | None
    amount: Decimal
    method: SettlementMethod
    status: SettlementStatus
    reference: str | None
    note: str | None
    rejection_reason: str | None
    confirmed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class SettlementReceiptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    settlement_id: UUID
    bucket: str
    storage_path: str
    filename: str
    mime_type: str
    size_bytes: int
