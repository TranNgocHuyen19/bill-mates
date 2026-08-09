from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.expenses.schemas import (
    ExpenseDraftCreate,
    ExpenseDraftUpdate,
    ExpenseItemCreate,
    ExpenseItemResponse,
    ExpenseReceiptResponse,
    ExpenseResponse,
    ExpenseSplitResponse,
    SplitUpdate,
)
from src.expenses.service import ExpenseService
from src.models import ExpenseStatus
from src.users.dependencies import CurrentUser

router = APIRouter(tags=["Expenses"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/rooms/{room_id}/expenses", response_model=list[ExpenseResponse])
async def list_expenses(
    room_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
    expense_status: ExpenseStatus | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> object:
    return await ExpenseService.list_expenses(
        session,
        current_user,
        room_id,
        expense_status=expense_status,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/rooms/{room_id}/expenses",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_expense_draft(
    room_id: UUID,
    data: ExpenseDraftCreate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await ExpenseService.create_draft(session, current_user, room_id, data)


@router.get("/expenses/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await ExpenseService.get_expense(session, current_user, expense_id)


@router.patch("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense_draft(
    expense_id: UUID,
    data: ExpenseDraftUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await ExpenseService.update_draft(session, current_user, expense_id, data)


@router.post(
    "/expenses/{expense_id}/items",
    response_model=ExpenseItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_expense_item(
    expense_id: UUID,
    data: ExpenseItemCreate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await ExpenseService.add_item(session, current_user, expense_id, data)


@router.delete("/expense-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense_item(
    item_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> Response:
    await ExpenseService.delete_item(session, current_user, item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put(
    "/expense-items/{item_id}/splits",
    response_model=list[ExpenseSplitResponse],
)
async def update_item_splits(
    item_id: UUID,
    data: SplitUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await ExpenseService.update_splits(session, current_user, item_id, data)


@router.post("/expenses/{expense_id}/post", response_model=ExpenseResponse)
async def post_expense(
    expense_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await ExpenseService.post_expense(session, current_user, expense_id)


@router.post("/expenses/{expense_id}/cancel", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_expense(
    expense_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> Response:
    await ExpenseService.cancel_expense(session, current_user, expense_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/expenses/{expense_id}/receipts",
    response_model=ExpenseReceiptResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_expense_receipt(
    expense_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
    file: Annotated[UploadFile, File()],
) -> object:
    content = await file.read()
    return await ExpenseService.upload_receipt(
        session,
        current_user,
        expense_id,
        filename=file.filename or "receipt.jpg",
        mime_type=file.content_type or "application/octet-stream",
        content=content,
    )


@router.get(
    "/expenses/{expense_id}/receipts",
    response_model=list[ExpenseReceiptResponse],
)
async def list_expense_receipts(
    expense_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await ExpenseService.list_receipts(
        session,
        current_user,
        expense_id,
    )


@router.get(
    "/expense-receipts/{receipt_id}",
    response_model=ExpenseReceiptResponse,
)
async def get_expense_receipt(
    receipt_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await ExpenseService.get_receipt(
        session,
        current_user,
        receipt_id,
    )


@router.post(
    "/expense-receipts/{receipt_id}/ocr",
    response_model=ExpenseReceiptResponse,
)
async def scan_expense_receipt(
    receipt_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
    force: bool = False,
) -> object:
    return await ExpenseService.scan_receipt(
        session,
        current_user,
        receipt_id,
        force=force,
    )
