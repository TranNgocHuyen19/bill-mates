from collections.abc import AsyncIterator
from datetime import date
from decimal import Decimal
from uuid import UUID

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.activity import models as activity_models  # noqa: F401
from src.debts import models as debt_models  # noqa: F401
from src.expenses import models as expense_models  # noqa: F401
from src.expenses.models import ExpenseReceipt
from src.expenses.ocr import parse_receipt_lines
from src.expenses.schemas import ExpenseDraftCreate
from src.expenses.service import ExpenseService
from src.models import Base, OcrStatus
from src.rooms import models as room_models  # noqa: F401
from src.rooms.schemas import RoomCreate
from src.rooms.service import RoomService
from src.users import models as user_models  # noqa: F401
from src.users.dependencies import AuthenticatedUser


@pytest_asyncio.fixture
async def session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as database_session:
        yield database_session
    await engine.dispose()


def test_when_receipt_has_item_lines_then_structured_suggestions_are_returned() -> None:
    lines = [
        {"text": "CỬA HÀNG TIỆN LỢI", "confidence": 0.98},
        {"text": "Coca Cola 2 x 12.000 24.000", "confidence": 0.96},
        {"text": "Bánh mì 15.000", "confidence": 0.94},
        {"text": "TỔNG CỘNG 39.000", "confidence": 0.99},
    ]

    result = parse_receipt_lines(lines)

    assert result["merchant"] == lines[0]["text"]
    assert result["total_amount"] == 39_000
    assert result["items"] == [
        {
            "name": "Coca Cola",
            "quantity": 2.0,
            "unit_price": 12_000,
            "total_amount": 24_000,
            "confidence": 0.96,
        },
        {
            "name": "Bánh mì",
            "quantity": 1.0,
            "unit_price": 15_000,
            "total_amount": 15_000,
            "confidence": 0.94,
        },
    ]


def test_when_receipt_uses_decimal_currency_then_amount_is_not_multiplied() -> None:
    lines = [
        {"text": "Siêu thị Mini", "confidence": 0.95},
        {"text": "Nước giặt 125000.00", "confidence": 0.91},
        {"text": "TOTAL 125.000,00", "confidence": 0.97},
    ]

    result = parse_receipt_lines(lines)

    assert result["total_amount"] == 125_000
    assert result["items"][0]["total_amount"] == 125_000


def test_when_receipt_starts_with_heading_then_merchant_is_not_the_heading() -> None:
    lines = [
        {"text": "HÓA ĐƠN BÁN HÀNG", "confidence": 0.99},
        {"text": "Cửa hàng Mini", "confidence": 0.98},
        {"text": "TỔNG TIỀN 39.000", "confidence": 0.97},
    ]

    result = parse_receipt_lines(lines)

    assert result["merchant"] == lines[1]["text"]


@pytest.mark.asyncio
async def test_when_ocr_succeeds_then_result_and_status_are_persisted(
    session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    user = AuthenticatedUser(
        id=UUID("00000000-0000-0000-0000-000000000001"),
        email="owner@example.com",
        user_metadata={"name": "Owner"},
    )
    room = await RoomService.create_room(session, user, RoomCreate(name="Phòng 101"))
    detail = await RoomService.get_room_detail(session, user, room.id)
    draft = await ExpenseService.create_draft(
        session,
        user,
        room.id,
        ExpenseDraftCreate(
            title="Đi chợ",
            total_amount=Decimal(39_000),
            paid_by_member_id=detail.members[0].id,
            expense_date=date(2026, 8, 9),
        ),
    )
    receipt = ExpenseReceipt(
        expense_id=draft["id"],
        bucket="receipts",
        storage_path="rooms/room/expenses/expense/receipt.jpg",
        filename="receipt.jpg",
        mime_type="image/jpeg",
        size_bytes=1_024,
        ocr_status=OcrStatus.NOT_REQUESTED,
    )
    expected_ocr_data = {
        "provider": "paddleocr",
        "merchant": "Cửa hàng Mini",
        "total_amount": 39_000,
        "items": [],
    }

    async def download_receipt(_: ExpenseReceipt) -> bytes:
        return b"receipt-image"

    def process_receipt(_: bytes) -> dict[str, object]:
        return expected_ocr_data

    session.add(receipt)
    await session.commit()
    await session.refresh(receipt)
    monkeypatch.setattr(ExpenseService, "_download_receipt", download_receipt)
    monkeypatch.setattr("src.expenses.service.process_receipt_image", process_receipt)

    result = await ExpenseService.scan_receipt(session, user, receipt.id)

    assert result.ocr_status == OcrStatus.COMPLETED
    assert result.ocr_data == expected_ocr_data
