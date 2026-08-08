from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.debts.schemas import (
    BalanceSummary,
    SettlementCreate,
    SettlementReceiptResponse,
    SettlementReject,
    SettlementResponse,
)
from src.debts.service import DebtService
from src.models import SettlementStatus
from src.users.dependencies import CurrentUser

router = APIRouter(tags=["Balances and settlements"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/rooms/{room_id}/balances", response_model=BalanceSummary)
async def get_room_balances(
    room_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await DebtService.get_balances(session, current_user, room_id)


@router.get(
    "/rooms/{room_id}/settlements",
    response_model=list[SettlementResponse],
)
async def list_settlements(
    room_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
    settlement_status: SettlementStatus | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> object:
    return await DebtService.list_settlements(
        session,
        current_user,
        room_id,
        settlement_status=settlement_status,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/rooms/{room_id}/settlements",
    response_model=SettlementResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_settlement(
    room_id: UUID,
    data: SettlementCreate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await DebtService.create_settlement(session, current_user, room_id, data)


@router.post(
    "/settlements/{settlement_id}/confirm",
    response_model=SettlementResponse,
)
async def confirm_settlement(
    settlement_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await DebtService.confirm_settlement(session, current_user, settlement_id)


@router.post(
    "/settlements/{settlement_id}/reject",
    response_model=SettlementResponse,
)
async def reject_settlement(
    settlement_id: UUID,
    data: SettlementReject,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> object:
    return await DebtService.reject_settlement(
        session,
        current_user,
        settlement_id,
        data.reason,
    )


@router.post(
    "/settlements/{settlement_id}/cancel",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def cancel_settlement(
    settlement_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> Response:
    await DebtService.cancel_settlement(session, current_user, settlement_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/settlements/{settlement_id}/receipts",
    response_model=SettlementReceiptResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_settlement_receipt(
    settlement_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
    file: Annotated[UploadFile, File()],
) -> object:
    content = await file.read()
    return await DebtService.upload_receipt(
        session,
        current_user,
        settlement_id,
        filename=file.filename or "payment-proof.jpg",
        mime_type=file.content_type or "application/octet-stream",
        content=content,
    )
