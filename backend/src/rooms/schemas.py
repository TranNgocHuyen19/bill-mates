from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from src.models import MembershipStatus, RoomRole


class RoomCreate(BaseModel):
    name: str = Field(min_length=2, max_length=128)
    description: str | None = None
    currency: str = Field(default="VND", min_length=3, max_length=3)


class RoomUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=128)
    description: str | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=3)


class RoomSummary(BaseModel):
    id: UUID
    name: str
    description: str | None
    currency: str
    role: RoomRole
    status: MembershipStatus
    member_count: int
    total_expenses: Decimal = Decimal(0)
    archived_at: datetime | None


class RoomMemberResponse(BaseModel):
    id: UUID
    profile_id: UUID
    display_name: str
    email: str
    nickname: str | None
    role: RoomRole
    status: MembershipStatus
    joined_at: datetime | None


class RoomDetail(RoomSummary):
    members: list[RoomMemberResponse]


class InviteCreate(BaseModel):
    expires_in_hours: int = Field(default=72, ge=1, le=24 * 30)
    max_uses: int = Field(default=1, ge=1, le=100)


class InviteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    room_id: UUID
    token: str
    expires_at: datetime
    max_uses: int
    use_count: int


class MemberRoleUpdate(BaseModel):
    role: RoomRole


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    icon: str | None = Field(default=None, max_length=64)
    color: str | None = Field(default=None, max_length=16)
    description: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    icon: str | None = Field(default=None, max_length=64)
    color: str | None = Field(default=None, max_length=16)
    description: str | None = None
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    room_id: UUID
    name: str
    icon: str | None
    color: str | None
    description: str | None
    is_active: bool
