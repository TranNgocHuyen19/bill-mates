from typing import Any
from uuid import UUID

from sqlalchemy import JSON, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models import Base, TimestampMixin, UUIDPrimaryKeyMixin


class ActivityLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "activity_logs"
    __table_args__ = (
        Index("activity_logs_room_id_created_at_idx", "room_id", "created_at"),
    )

    room_id: Mapped[UUID] = mapped_column(
        ForeignKey("rooms.id", ondelete="RESTRICT"),
        nullable=False,
    )
    actor_profile_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("profiles.id", ondelete="SET NULL"),
    )
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[UUID | None]
    old_values: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    new_values: Mapped[dict[str, Any] | None] = mapped_column(JSON)
