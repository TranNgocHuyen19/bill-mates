from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.exceptions import AppError

router = APIRouter(prefix="/health", tags=["Health"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("")
async def health_check(session: DatabaseSession) -> dict[str, str]:
    try:
        await session.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise AppError(
            code="database_unavailable",
            message="Không thể kết nối cơ sở dữ liệu.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        ) from exc

    return {"status": "ok", "database": "connected"}
