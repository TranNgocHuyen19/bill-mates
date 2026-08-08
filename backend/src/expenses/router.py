from typing import Any
from fastapi import APIRouter, Depends, UploadFile, File
from src.expenses.schemas import ExpenseCreate
from src.expenses.service import ExpenseService
from src.users.dependencies import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("")
async def get_expenses(
    room_id: str = "101",
    current_user: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    """Danh sách các hóa đơn gần đây của phòng."""
    expenses = await ExpenseService.get_recent_expenses(room_id)
    return {"status": "success", "data": expenses}


@router.post("")
async def create_expense(
    data: ExpenseCreate,
    current_user: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    """Tạo hóa đơn chi tiêu mới & tự động phân rã nợ."""
    user_id = current_user.get("sub", "user_101")
    return await ExpenseService.create_expense(data, user_id)


@router.post("/ocr")
async def scan_bill_ocr(
    file: UploadFile = File(...),
    current_user: dict[str, Any] = Depends(get_current_user)
) -> dict[str, Any]:
    """Tải ảnh hóa đơn lên để AI quét trích xuất thông tin tự động."""
    content = await file.read()
    return await ExpenseService.scan_bill_ocr(content)
