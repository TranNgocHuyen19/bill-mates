from collections.abc import AsyncIterator
from uuid import UUID

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.activity import models as activity_models  # noqa: F401
from src.debts import models as debt_models  # noqa: F401
from src.expenses import models as expense_models  # noqa: F401
from src.models import Base, RoomRole
from src.rooms import models as room_models  # noqa: F401
from src.rooms.schemas import InviteCreate, RoomCreate
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


def user(user_id: str, email: str) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=UUID(user_id),
        email=email,
        user_metadata={"name": email.split("@", maxsplit=1)[0].title()},
    )


async def test_create_room_creates_owner_and_default_categories(
    session: AsyncSession,
) -> None:
    owner = user("00000000-0000-0000-0000-000000000001", "owner@example.com")

    room = await RoomService.create_room(
        session,
        owner,
        RoomCreate(name="Phòng 101", description="Chi phí sinh hoạt"),
    )
    detail = await RoomService.get_room_detail(session, owner, room.id)
    categories = await RoomService.list_categories(session, owner, room.id)

    assert room.role == RoomRole.OWNER
    assert detail.member_count == 1
    assert detail.members[0].email == "owner@example.com"
    assert {category.name for category in categories} == {
        "Ăn uống",
        "Điện nước",
        "Nhà ở",
        "Khác",
    }


async def test_invite_can_be_used_to_join_room(session: AsyncSession) -> None:
    owner = user("00000000-0000-0000-0000-000000000001", "owner@example.com")
    member = user("00000000-0000-0000-0000-000000000002", "member@example.com")
    room = await RoomService.create_room(session, owner, RoomCreate(name="Phòng 101"))
    invite = await RoomService.create_invite(
        session,
        owner,
        room.id,
        InviteCreate(max_uses=1),
    )

    membership = await RoomService.join_room(session, member, invite.token)
    detail = await RoomService.get_room_detail(session, member, room.id)

    assert membership.role == RoomRole.MEMBER
    assert detail.member_count == 2
