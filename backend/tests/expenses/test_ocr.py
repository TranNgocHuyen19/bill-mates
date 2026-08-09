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


def test_when_lotte_receipt_uses_column_rows_then_each_price_is_extracted() -> None:
    lines = [
        {
            "text": "001 SCA TH MILK DUA 100G*4",
            "confidence": 0.99,
            "box": [38, 274, 692, 315],
        },
        {"text": "35500", "confidence": 0.99, "box": [484, 329, 617, 371]},
        {"text": "1", "confidence": 0.99, "box": [711, 332, 742, 369]},
        {"text": "35,500", "confidence": 0.99, "box": [884, 328, 1042, 374]},
        {"text": "003 THIT HEO XAY", "confidence": 0.99, "box": [36, 495, 441, 536]},
        {"text": "119000", "confidence": 0.99, "box": [464, 551, 639, 589]},
        {"text": "0.310", "confidence": 0.99, "box": [636, 551, 790, 589]},
        {"text": "36,890", "confidence": 0.99, "box": [885, 549, 1042, 592]},
        {
            "text": "009 MONG TOI BABY 300G",
            "confidence": 0.99,
            "box": [37, 1320, 592, 1363],
        },
        {"text": "31500", "confidence": 0.99, "box": [483, 1376, 616, 1418]},
        {"text": "1", "confidence": 0.99, "box": [712, 1379, 741, 1414]},
        {"text": "31,500", "confidence": 0.99, "box": [883, 1375, 1043, 1421]},
        {"text": "[STIKER]", "confidence": 0.99, "box": [39, 1430, 238, 1476]},
        {"text": "20%", "confidence": 0.99, "box": [434, 1432, 519, 1474]},
        {"text": "-6,300", "confidence": 0.99, "box": [888, 1430, 1043, 1477]},
        {
            "text": "010 TUI NYLON SIZE 35-60",
            "confidence": 0.99,
            "box": [36, 1485, 639, 1529],
        },
        {"text": "300", "confidence": 0.99, "box": [533, 1542, 617, 1583]},
        {"text": "1", "confidence": 0.99, "box": [711, 1545, 741, 1581]},
        {"text": "300", "confidence": 0.99, "box": [959, 1539, 1044, 1584]},
        {"text": "Tong cong", "confidence": 0.99, "box": [31, 1761, 268, 1814]},
        {"text": "294,844", "confidence": 0.99, "box": [861, 1764, 1042, 1806]},
        {"text": "giam gia san pham", "confidence": 0.99, "box": [31, 1818, 300, 1860]},
        {"text": "-6,300", "confidence": 0.99, "box": [861, 1818, 1042, 1860]},
        {"text": "Giam gia don so", "confidence": 0.99, "box": [31, 1864, 300, 1906]},
        {"text": "-44", "confidence": 0.99, "box": [961, 1864, 1042, 1906]},
        {"text": "Tien nhan", "confidence": 0.99, "box": [31, 1950, 250, 1990]},
        {"text": "288,500", "confidence": 0.99, "box": [861, 1950, 1042, 1990]},
        {
            "text": "Scode:22043620036890003101",
            "confidence": 0.99,
            "box": [61, 603, 714, 646],
        },
    ]

    result = parse_receipt_lines(lines)

    assert [(item["name"], item["total_amount"]) for item in result["items"]] == [
        ("SCA TH MILK DUA 100G*4", 35_500),
        ("THIT HEO XAY", 36_890),
        ("MONG TOI BABY 300G", 25_200),
        ("TUI NYLON SIZE 35-60", 300),
    ]
    assert result["items"][1]["quantity"] == 0.31
    assert result["items"][1]["unit_price"] == 119_000
    assert result["items"][2]["original_total_amount"] == 31_500
    assert result["items"][2]["discount_amount"] == 6_300
    assert result["items"][2]["discount_percent"] == 20
    assert result["total_amount"] == 288_500
    assert result["subtotal_amount"] == 294_844
    assert result["discount_amount"] == 6_344
    assert result["order_discount_amount"] == 44


def test_when_bach_hoa_xanh_receipt_uses_multiline_products_then_weighted_prices_are_extracted() -> (
    None
):
    lines = [
        {
            "text": "băng vệ sinh diana super night 29cm (4 miếng)",
            "confidence": 0.99,
            "box": [45, 420, 724, 465],
        },
        {"text": "2", "confidence": 1.0, "box": [93, 470, 127, 510]},
        {"text": "23.500 (VAT:8%)", "confidence": 0.99, "box": [358, 468, 603, 510]},
        {"text": "47.000", "confidence": 1.0, "box": [720, 470, 827, 510]},
        {"text": "khoai mỡ", "confidence": 0.99, "box": [46, 333, 188, 376]},
        {"text": "0,406", "confidence": 1.0, "box": [63, 379, 154, 421]},
        {
            "text": "33.000 16.500 (VAT:5%)",
            "confidence": 0.99,
            "box": [254, 382, 601, 424],
        },
        {"text": "6.699", "confidence": 1.0, "box": [740, 383, 827, 425]},
        {"text": "ớt hiểm túi 50g", "confidence": 0.99, "box": [46, 525, 267, 568]},
        {"text": "1", "confidence": 1.0, "box": [94, 579, 125, 620]},
        {"text": "4.400 (VAT:5%)", "confidence": 1.0, "box": [381, 578, 601, 620]},
        {"text": "4.400", "confidence": 1.0, "box": [739, 579, 827, 621]},
        {
            "text": "nước xả vải downy làn gió mát dây 20ml/18ml",
            "confidence": 0.99,
            "box": [46, 1348, 712, 1391],
        },
        {"text": "2", "confidence": 1.0, "box": [93, 1396, 127, 1436]},
        {
            "text": "21.000 18.500 (VAT:8%)",
            "confidence": 0.99,
            "box": [251, 1394, 602, 1442],
        },
        {"text": "37.000", "confidence": 1.0, "box": [720, 1397, 828, 1436]},
        {"text": "Phải thanh toán:", "confidence": 0.99, "box": [47, 1551, 289, 1593]},
        {"text": "724.447", "confidence": 1.0, "box": [699, 1554, 826, 1595]},
    ]

    result = parse_receipt_lines(lines)

    assert [(item["name"], item["total_amount"]) for item in result["items"]] == [
        ("băng vệ sinh diana super night 29cm (4 miếng)", 47_000),
        ("khoai mỡ", 6_699),
        ("ớt hiểm túi 50g", 4_400),
        ("nước xả vải downy làn gió mát dây 20ml/18ml", 37_000),
    ]
    assert result["items"][1]["quantity"] == 0.406
    assert result["items"][1]["unit_price"] == 16_500
    assert result["total_amount"] == 724_447


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
