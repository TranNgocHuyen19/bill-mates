from pydantic import BaseModel, EmailStr, ConfigDict


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    bank_name: str | None = None
    account_number: str | None = None
    account_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    name: str | None = None
    bank_name: str | None = None
    account_number: str | None = None
    account_name: str | None = None
