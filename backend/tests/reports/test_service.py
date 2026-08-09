from collections.abc import AsyncIterator
from datetime import UTC, date, datetime
from decimal import Decimal
from io import BytesIO
from uuid import UUID
from zipfile import ZipFile

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.activity import models as activity_models  # noqa: F401
from src.debts import models as debt_models  # noqa: F401
from src.debts.models import Settlement
from src.debts.schemas import SettlementCreate
from src.debts.service import DebtService
from src.expenses import models as expense_models  # noqa: F401
from src.expenses.schemas import (
    ExactSplitRequest,
    ExpenseDraftCreate,
    ExpenseItemCreate,
    SplitParticipant,
)
from src.expenses.service import ExpenseService
from src.models import Base, MembershipStatus, RoomRole, SettlementMethod
from src.reports.service import ReportService
from src.reports.workbook import build_report_workbook
from src.rooms import models as room_models  # noqa: F401
from src.rooms.models import RoomMember
from src.rooms.schemas import RoomCreate
from src.rooms.service import RoomService
from src.users import models as user_models  # noqa: F401
from src.users.dependencies import AuthenticatedUser
from src.users.service import UserService


@pytest_asyncio.fixture
async def session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as database_session:
        yield database_session
    await engine.dispose()


async def _create_report(session: AsyncSession):
    owner = AuthenticatedUser(
        id=UUID("00000000-0000-0000-0000-000000000101"),
        email="owner@example.com",
        user_metadata={"name": "Chủ phòng"},
    )
    roommate = AuthenticatedUser(
        id=UUID("00000000-0000-0000-0000-000000000102"),
        email="roommate@example.com",
        user_metadata={"name": "Bạn cùng phòng"},
    )
    room = await RoomService.create_room(
        session,
        owner,
        RoomCreate(name="Trọ Việt"),
    )
    detail = await RoomService.get_room_detail(session, owner, room.id)
    owner_member_id = detail.members[0].id
    await UserService.get_or_create_profile(session, roommate)
    roommate_member = RoomMember(
        room_id=room.id,
        profile_id=roommate.id,
        role=RoomRole.MEMBER,
        status=MembershipStatus.ACTIVE,
        nickname="An",
    )
    session.add(roommate_member)
    await session.commit()
    await session.refresh(roommate_member)

    expense = await ExpenseService.create_draft(
        session,
        owner,
        room.id,
        ExpenseDraftCreate(
            title="=Tiền điện tháng 8",
            note="@ghi chú tiếng Việt",
            total_amount=Decimal(100000),
            paid_by_member_id=owner_member_id,
            expense_date=date(2026, 8, 9),
        ),
    )
    item = await ExpenseService.add_item(
        session,
        owner,
        expense["id"],
        ExpenseItemCreate(name="+Điện sinh hoạt", unit_price=Decimal(100000)),
    )
    await ExpenseService.update_splits(
        session,
        owner,
        item["id"],
        ExactSplitRequest(
            method="exact",
            splits=[
                SplitParticipant(
                    member_id=roommate_member.id,
                    share_value=Decimal(100000),
                )
            ],
        ),
    )
    await ExpenseService.post_expense(session, owner, expense["id"])
    await ExpenseService.create_draft(
        session,
        owner,
        room.id,
        ExpenseDraftCreate(
            title="Nháp không được tính",
            total_amount=Decimal(900000),
            paid_by_member_id=owner_member_id,
            expense_date=date(2026, 8, 10),
        ),
    )

    settlement_payload = await DebtService.create_settlement(
        session,
        roommate,
        room.id,
        SettlementCreate(
            to_member_id=owner_member_id,
            amount=Decimal(25000),
            method=SettlementMethod.CASH,
        ),
    )
    await DebtService.confirm_settlement(session, owner, settlement_payload["id"])
    settlement = await session.get(Settlement, settlement_payload["id"])
    assert settlement is not None
    settlement.created_at = datetime(2026, 8, 10, 2, tzinfo=UTC)
    settlement.confirmed_at = datetime(2026, 8, 10, 2, 5, tzinfo=UTC)
    await session.commit()

    return await ReportService.get_report(
        session,
        owner,
        room.id,
        date(2026, 8, 1),
        date(2026, 8, 31),
    )


@pytest.mark.asyncio
async def test_report_uses_posted_expenses_and_confirmed_settlements(
    session: AsyncSession,
) -> None:
    report = await _create_report(session)

    assert report.summary.posted_expense_count == 1
    assert report.summary.total_expenses == Decimal(100000)
    assert report.summary.confirmed_settlement_amount == Decimal(25000)
    assert report.monthly[0].month == "2026-08"
    assert report.monthly[0].total == Decimal(100000)
    assert report.categories[0].name == "Chưa phân loại"
    assert report.categories[0].total == Decimal(100000)
    assert len(report.expenses) == 1
    assert "Nháp" not in report.expenses[0].title

    balances = {row.display_name: row.balance for row in report.members}
    assert balances["Chủ phòng"] == Decimal(75000)
    assert balances["An"] == Decimal(-75000)
    assert sum(balances.values(), Decimal(0)) == 0


@pytest.mark.asyncio
async def test_workbook_has_expected_sheets_and_no_formulas(
    session: AsyncSession,
) -> None:
    report = await _create_report(session)
    workbook_bytes = build_report_workbook(report)

    assert workbook_bytes.startswith(b"PK")
    with ZipFile(BytesIO(workbook_bytes)) as archive:
        workbook_xml = archive.read("xl/workbook.xml").decode("utf-8")
        expected_order = [
            "Summary",
            "Expenses",
            "Items",
            "Splits",
            "Balances",
            "Settlements",
        ]
        positions = [workbook_xml.index(f'name="{name}"') for name in expected_order]
        assert positions == sorted(positions)

        worksheet_names = [
            name
            for name in archive.namelist()
            if name.startswith("xl/worksheets/sheet") and name.endswith(".xml")
        ]
        assert len(worksheet_names) == 6
        assert all(b"<f" not in archive.read(name) for name in worksheet_names)
        shared_strings = archive.read("xl/sharedStrings.xml").decode("utf-8")
        assert "=Tiền điện tháng 8" in shared_strings
        assert "+Điện sinh hoạt" in shared_strings
