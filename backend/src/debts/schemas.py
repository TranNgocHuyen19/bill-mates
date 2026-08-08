from pydantic import BaseModel, ConfigDict


class DebtItemSchema(BaseModel):
    id: str
    name: str
    amount: str
    reason: str


class OptimizedTransactionSchema(BaseModel):
    from_user: str
    to_user: str
    amount: float
    formatted_amount: str


class SettleDebtInput(BaseModel):
    to_user_id: str
    amount: float
    payment_method: str = "VietQR"
