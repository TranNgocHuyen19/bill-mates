from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.models import (
    Base,
    InviteStatus,
    MembershipStatus,
    RoomRole,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
    enum_values,
)


class Room(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "rooms"

    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="VND")
    created_by_profile_id: Mapped[UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class RoomMember(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "room_members"
    __table_args__ = (UniqueConstraint("room_id", "profile_id"),)

    room_id: Mapped[UUID] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    profile_id: Mapped[UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    role: Mapped[RoomRole] = mapped_column(
        Enum(
            RoomRole,
            name="room_role",
            values_callable=enum_values,
            validate_strings=True,
        ),
        nullable=False,
        default=RoomRole.MEMBER,
    )
    status: Mapped[MembershipStatus] = mapped_column(
        Enum(
            MembershipStatus,
            name="membership_status",
            values_callable=enum_values,
            validate_strings=True,
        ),
        nullable=False,
        default=MembershipStatus.ACTIVE,
    )
    nickname: Mapped[str | None] = mapped_column(String(80))
    joined_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class RoomInvite(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "room_invites"
    __table_args__ = (
        UniqueConstraint("token"),
        CheckConstraint("max_uses > 0", name="max_uses_positive"),
        CheckConstraint("use_count >= 0", name="use_count_non_negative"),
    )

    room_id: Mapped[UUID] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_member_id: Mapped[UUID] = mapped_column(
        ForeignKey("room_members.id", ondelete="RESTRICT"),
        nullable=False,
    )
    token: Mapped[str] = mapped_column(String(96), nullable=False)
    status: Mapped[InviteStatus] = mapped_column(
        Enum(
            InviteStatus,
            name="invite_status",
            values_callable=enum_values,
            validate_strings=True,
        ),
        nullable=False,
        default=InviteStatus.ACTIVE,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    max_uses: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    use_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class Category(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("room_id", "name"),)

    room_id: Mapped[UUID] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(64))
    color: Mapped[str | None] = mapped_column(String(16))
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
