from collections.abc import AsyncIterator
from datetime import date
from decimal import Decimal
from uuid import UUID

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.activity import models as activity_models  # noqa: F401
from src.debts import models as debt_models  # noqa: F401
from src.debts.schemas import SettlementCreate
from src.debts.service import DebtService, simplify_balances
from src.exceptions import AppError
from src.expenses import models as expense_models  # noqa: F401
from src.expenses.schemas import (
    ExactSplitRequest,
    ExpenseDraftCreate,
    ExpenseItemCreate,
    SplitParticipant,
)
from src.expenses.service import ExpenseService
from src.models import (
    Base,
    MembershipStatus,
    RoomRole,
    SettlementMethod,
)
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


def test_simplify_balances_is_deterministic() -> None:
    member_a = UUID("00000000-0000-0000-0000-000000000001")
    member_b = UUID("00000000-0000-0000-0000-000000000002")
    member_c = UUID("00000000-0000-0000-0000-000000000003")

    suggestions = simplify_balances(
        {
            member_a: Decimal(100000),
            member_b: Decimal(-60000),
            member_c: Decimal(-40000),
        }
    )

    assert suggestions == [
        (member_b, member_a, Decimal(60000)),
        (member_c, member_a, Decimal(40000)),
    ]


@pytest.mark.asyncio
async def test_only_posted_expenses_and_confirmed_settlements_affect_balances(
    session: AsyncSession,
) -> None:
    owner_user = AuthenticatedUser(
        id=UUID("00000000-0000-0000-0000-000000000001"),
        email="owner@example.com",
        user_metadata={"name": "Owner"},
    )
    roommate_user = AuthenticatedUser(
        id=UUID("00000000-0000-0000-0000-000000000002"),
        email="roommate@example.com",
        user_metadata={"name": "Roommate"},
    )
    room = await RoomService.create_room(
        session,
        owner_user,
        RoomCreate(name="Phòng 101"),
    )
    owner_detail = await RoomService.get_room_detail(session, owner_user, room.id)
    owner_member_id = owner_detail.members[0].id
    await UserService.get_or_create_profile(session, roommate_user)
    roommate_member = RoomMember(
        room_id=room.id,
        profile_id=roommate_user.id,
        role=RoomRole.MEMBER,
        status=MembershipStatus.ACTIVE,
    )
    session.add(roommate_member)
    await session.commit()
    await session.refresh(roommate_member)

    draft = await ExpenseService.create_draft(
        session,
        owner_user,
        room.id,
        ExpenseDraftCreate(
            title="Tiền điện",
            total_amount=Decimal(100000),
            paid_by_member_id=owner_member_id,
            expense_date=date(2026, 8, 9),
        ),
    )
    before_post = await DebtService.get_balances(session, roommate_user, room.id)
    assert before_post["current_balance"] == Decimal(0)

    item = await ExpenseService.add_item(
        session,
        owner_user,
        draft["id"],
        ExpenseItemCreate(name="Điện", unit_price=Decimal(100000)),
    )
    await ExpenseService.update_splits(
        session,
        owner_user,
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
    await ExpenseService.post_expense(session, owner_user, draft["id"])

    posted_balance = await DebtService.get_balances(session, roommate_user, room.id)
    assert posted_balance["current_balance"] == Decimal(-100000)
    assert posted_balance["total_to_pay"] == Decimal(100000)

    pending = await DebtService.create_settlement(
        session,
        roommate_user,
        room.id,
        SettlementCreate(
            to_member_id=owner_member_id,
            amount=Decimal(100000),
            method=SettlementMethod.CASH,
        ),
    )
    while_pending = await DebtService.get_balances(session, roommate_user, room.id)
    assert while_pending["current_balance"] == Decimal(-100000)

    with pytest.raises(AppError, match="vượt quá công nợ"):
        await DebtService.create_settlement(
            session,
            roommate_user,
            room.id,
            SettlementCreate(
                to_member_id=owner_member_id,
                amount=Decimal(100000),
                method=SettlementMethod.CASH,
            ),
        )

    await DebtService.confirm_settlement(session, owner_user, pending["id"])
    after_confirm = await DebtService.get_balances(session, roommate_user, room.id)
    assert after_confirm["current_balance"] == Decimal(0)
    assert after_confirm["total_to_pay"] == Decimal(0)
