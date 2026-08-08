from pydantic import BaseModel, ConfigDict


class RoomMemberSchema(BaseModel):
    id: str
    name: str
    role: str = "Thành viên"
    balance: str = "0 ₫"
    is_positive: bool = True

    model_config = ConfigDict(from_attributes=True)


class RoomCreate(BaseModel):
    name: str
    address: str | None = None


class RoomResponse(BaseModel):
    id: str
    name: str
    address: str | None = None
    members_count: int = 1
    total_expenses: str = "0 ₫"
    user_balance: str = "0 ₫"
    is_owed: bool = False

    model_config = ConfigDict(from_attributes=True)


class AddMemberInput(BaseModel):
    email_or_phone: str
