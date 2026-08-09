from collections.abc import AsyncIterator
from uuid import UUID

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.activity import models as activity_models  # noqa: F401
from src.activity.service import ActivityService
from src.debts import models as debt_models  # noqa: F401
from src.expenses import models as expense_models  # noqa: F401
from src.models import Base
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


@pytest.mark.asyncio
async def test_room_activity_is_returned_with_actor_name(
    session: AsyncSession,
) -> None:
    owner = AuthenticatedUser(
        id=UUID("00000000-0000-0000-0000-000000000001"),
        email="owner@example.com",
        user_metadata={"name": "Owner"},
    )
    room = await RoomService.create_room(
        session,
        owner,
        RoomCreate(name="Phòng 101"),
    )

    activity = await ActivityService.list_activity(
        session,
        owner,
        room.id,
        action="room.created",
        entity_type=None,
        limit=20,
        offset=0,
    )

    assert len(activity) == 1
    assert activity[0]["action"] == "room.created"
    assert activity[0]["actor_name"] == "Owner"
