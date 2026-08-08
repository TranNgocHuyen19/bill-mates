from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from src.models import SettlementMethod


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_name: str
    email: EmailStr
    phone: str | None
    avatar_path: str | None
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=128)
    phone: str | None = Field(default=None, max_length=32)
    avatar_path: str | None = None


class PaymentAccountCreate(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    method: SettlementMethod
    bank_code: str | None = Field(default=None, max_length=32)
    bank_name: str | None = Field(default=None, max_length=128)
    account_number: str | None = Field(default=None, max_length=64)
    account_name: str | None = Field(default=None, max_length=128)
    wallet_provider: str | None = Field(default=None, max_length=64)
    is_default: bool = False

    @model_validator(mode="after")
    def validate_payment_details(self) -> "PaymentAccountCreate":
        if self.method == SettlementMethod.BANK_TRANSFER:
            required = (self.bank_name, self.account_number, self.account_name)
            if not all(required):
                raise ValueError("Tài khoản ngân hàng cần tên ngân hàng, số tài khoản và chủ tài khoản.")
        if self.method == SettlementMethod.E_WALLET and not self.wallet_provider:
            raise ValueError("Ví điện tử cần tên nhà cung cấp.")
        return self


class PaymentAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    label: str
    method: str
    bank_code: str | None
    bank_name: str | None
    account_number: str | None
    account_name: str | None
    wallet_provider: str | None
    is_default: bool
