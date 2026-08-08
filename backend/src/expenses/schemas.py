from pydantic import BaseModel, ConfigDict


class ExpenseItemSchema(BaseModel):
    name: str
    price: float
    assigned_members: list[str] = []


class ExpenseCreate(BaseModel):
    title: str
    amount: float
    payer_id: str
    split_type: str = "equal"  # equal, itemized, percentage
    room_id: str = "101"
    items: list[ExpenseItemSchema] = []

    model_config = ConfigDict(from_attributes=True)


class ExpenseResponse(BaseModel):
    id: str
    title: str
    amount: float
    payer_name: str
    date: str
    split_type: str

    model_config = ConfigDict(from_attributes=True)
