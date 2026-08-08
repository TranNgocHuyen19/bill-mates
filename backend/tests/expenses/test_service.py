from collections.abc import AsyncIterator
from datetime import date
from decimal import Decimal
from uuid import UUID

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.activity import models as activity_models  # noqa: F401
from src.debts import models as debt_models  # noqa: F401
from src.expenses import models as expense_models  # noqa: F401
from src.expenses.schemas import (
    EqualSplitRequest,
    ExpenseDraftCreate,
    ExpenseItemCreate,
    SplitParticipant,
)
from src.expenses.service import ExpenseService
from src.models import Base, ExpenseStatus, SplitMethod
from src.rooms import models as room_models  # noqa: F401
from src.rooms.schemas import RoomCreate
from src.rooms.service import RoomService
from src.users import models as user_models  # noqa: F401
from src.users.dependencies import AuthenticatedUser

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as database_session:
        yield database_session
    await engine.dispose()


async def test_draft_does_not_post_until_items_and_splits_reconcile(
    session: AsyncSession,
) -> None:
    user = AuthenticatedUser(
        id=UUID("00000000-0000-0000-0000-000000000001"),
        email="owner@example.com",
        user_metadata={"name": "Owner"},
    )
    room = await RoomService.create_room(session, user, RoomCreate(name="Phòng 101"))
    detail = await RoomService.get_room_detail(session, user, room.id)
    owner_member_id = detail.members[0].id
    draft = await ExpenseService.create_draft(
        session,
        user,
        room.id,
        ExpenseDraftCreate(
            title="Bữa tối",
            total_amount=Decimal(200_000),
            paid_by_member_id=owner_member_id,
            expense_date=date(2026, 8, 9),
        ),
    )
    item = await ExpenseService.add_item(
        session,
        user,
        draft["id"],
        ExpenseItemCreate(
            name="Toàn bộ hóa đơn",
            quantity=Decimal(1),
            unit_price=Decimal(200_000),
        ),
    )
    await ExpenseService.update_splits(
        session,
        user,
        item["id"],
        EqualSplitRequest(
            method=SplitMethod.EQUAL,
            splits=[SplitParticipant(member_id=owner_member_id)],
        ),
    )

    assert draft["status"] == ExpenseStatus.DRAFT

    posted = await ExpenseService.post_expense(session, user, draft["id"])

    assert posted["status"] == ExpenseStatus.POSTED
    assert sum(split.amount_owed for split in posted["items"][0]["splits"]) == Decimal(
        200_000
    )
