from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from src.models import SettlementMethod, SettlementStatus, SplitMethod


class ReportSummary(BaseModel):
    posted_expense_count: int
    total_expenses: Decimal
    member_count: int
    confirmed_settlement_count: int
    confirmed_settlement_amount: Decimal


class MonthlyReport(BaseModel):
    month: str
    expense_count: int
    total: Decimal


class CategoryReport(BaseModel):
    category_id: UUID | None
    name: str
    color: str | None
    total: Decimal


class MemberReport(BaseModel):
    member_id: UUID
    display_name: str
    paid: Decimal
    owed: Decimal
    settlements_sent: Decimal
    settlements_received: Decimal
    balance: Decimal


class ReportExpense(BaseModel):
    expense_id: UUID
    expense_date: date
    title: str
    payer_member_id: UUID
    payer_name: str
    total: Decimal
    note: str | None
    posted_at: datetime | None


class ReportItem(BaseModel):
    expense_id: UUID
    expense_date: date
    item_id: UUID
    position: int
    name: str
    category_id: UUID | None
    category_name: str
    quantity: Decimal
    unit_price: Decimal
    total: Decimal


class ReportSplit(BaseModel):
    expense_id: UUID
    item_id: UUID
    item_name: str
    member_id: UUID
    member_name: str
    split_method: SplitMethod
    share_value: Decimal | None
    amount_owed: Decimal


class ReportSettlement(BaseModel):
    settlement_id: UUID
    created_at: datetime
    confirmed_at: datetime | None
    from_member_id: UUID
    from_name: str
    to_member_id: UUID
    to_name: str
    amount: Decimal
    method: SettlementMethod
    status: SettlementStatus
    reference: str | None
    note: str | None


class RoomReport(BaseModel):
    room_id: UUID
    room_name: str
    currency: str
    from_date: date
    to_date: date
    timezone: str
    generated_at: datetime
    summary: ReportSummary
    monthly: list[MonthlyReport]
    categories: list[CategoryReport]
    members: list[MemberReport]
    expenses: list[ReportExpense]
    items: list[ReportItem]
    splits: list[ReportSplit]
    settlements: list[ReportSettlement]
