from typing import Any
from fastapi import APIRouter, Depends
from src.debts.schemas import SettleDebtInput
from src.debts.service import DebtService
from src.users.dependencies import get_current_user

router = APIRouter(prefix="/debts", tags=["Debts"])


@router.get("")
async def get_debts_summary(
    room_id: str = "101",
    current_user: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    """Danh sách công nợ chi tiết & kết quả gợi ý thuật toán gộp nợ tối ưu."""
    data = await DebtService.get_optimized_debts(room_id)
    return {"status": "success", "data": data}


@router.post("/settle")
async def settle_debt(
    data: SettleDebtInput,
    current_user: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    """Xác nhận thanh toán công nợ."""
    user_id = current_user.get("sub", "user_101")
    return await DebtService.settle_debt(data, user_id)
