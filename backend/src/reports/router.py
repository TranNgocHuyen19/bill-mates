import re
from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.reports.schemas import RoomReport
from src.reports.service import ReportService
from src.reports.workbook import build_report_workbook
from src.users.dependencies import CurrentUser

router = APIRouter(tags=["Reports"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
EXCEL_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _safe_filename(value: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9_-]+", "-", value.strip())
    return normalized.strip("-")[:60] or "room"


@router.get("/rooms/{room_id}/reports", response_model=RoomReport)
async def get_room_report(
    room_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
    from_date: Annotated[date, Query()],
    to_date: Annotated[date, Query()],
) -> object:
    return await ReportService.get_report(
        session,
        current_user,
        room_id,
        from_date,
        to_date,
    )


@router.get("/rooms/{room_id}/reports/export")
async def export_room_report(
    room_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
    from_date: Annotated[date, Query()],
    to_date: Annotated[date, Query()],
) -> Response:
    report = await ReportService.get_report(
        session,
        current_user,
        room_id,
        from_date,
        to_date,
    )
    content = await run_in_threadpool(build_report_workbook, report)
    filename = (
        f"bao-cao-{_safe_filename(report.room_name)}-"
        f"{from_date.isoformat()}-{to_date.isoformat()}.xlsx"
    )
    return Response(
        content=content,
        media_type=EXCEL_MEDIA_TYPE,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
