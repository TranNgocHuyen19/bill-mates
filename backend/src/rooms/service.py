import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.activity.models import ActivityLog
from src.exceptions import AppError
from src.expenses.models import Expense
from src.models import ExpenseStatus, InviteStatus, MembershipStatus, RoomRole
from src.rooms import repository
from src.rooms.models import Category, Room, RoomInvite, RoomMember
from src.rooms.schemas import (
    CategoryCreate,
    CategoryUpdate,
    InviteCreate,
    MemberRoleUpdate,
    RoomCreate,
    RoomDetail,
    RoomMemberResponse,
    RoomSummary,
    RoomUpdate,
)
from src.users.dependencies import AuthenticatedUser
from src.users.service import UserService

MANAGER_ROLES = {RoomRole.OWNER, RoomRole.ADMIN}
DEFAULT_CATEGORIES = (
    ("Ăn uống", "utensils", "#006c49"),
    ("Điện nước", "zap", "#24389c"),
    ("Nhà ở", "house", "#a33236"),
    ("Khác", "shapes", "#757684"),
)


def _summary(
    room: Room,
    membership: RoomMember,
    member_count: int,
    total_expenses: Decimal,
) -> RoomSummary:
    return RoomSummary(
        id=room.id,
        name=room.name,
        description=room.description,
        currency=room.currency,
        role=membership.role,
        status=membership.status,
        member_count=member_count,
        total_expenses=total_expenses,
        archived_at=room.archived_at,
    )


async def require_room_member(
    session: AsyncSession,
    room_id: UUID,
    profile_id: UUID,
    *,
    roles: set[RoomRole] | None = None,
) -> RoomMember:
    membership = await repository.get_membership(session, room_id, profile_id)
    if membership is None or membership.status != MembershipStatus.ACTIVE:
        raise AppError(
            code="room_access_denied",
            message="Bạn không phải thành viên đang hoạt động của phòng này.",
            status_code=status.HTTP_403_FORBIDDEN,
        )
    if roles is not None and membership.role not in roles:
        raise AppError(
            code="room_role_required",
            message="Bạn không có quyền thực hiện thao tác này.",
            status_code=status.HTTP_403_FORBIDDEN,
        )
    return membership


class RoomService:
    @staticmethod
    async def list_rooms(
        session: AsyncSession,
        user: AuthenticatedUser,
    ) -> list[RoomSummary]:
        await UserService.get_or_create_profile(session, user)
        rows = await repository.list_room_rows(session, user.id)
        return [_summary(*row) for row in rows]

    @staticmethod
    async def create_room(
        session: AsyncSession,
        user: AuthenticatedUser,
        data: RoomCreate,
    ) -> RoomSummary:
        await UserService.get_or_create_profile(session, user)
        room = Room(
            name=data.name.strip(),
            description=data.description,
            currency=data.currency.upper(),
            created_by_profile_id=user.id,
        )
        session.add(room)
        await session.flush()

        owner = RoomMember(
            room_id=room.id,
            profile_id=user.id,
            role=RoomRole.OWNER,
            status=MembershipStatus.ACTIVE,
            joined_at=datetime.now(UTC),
        )
        session.add(owner)
        session.add_all(
            [
                Category(room_id=room.id, name=name, icon=icon, color=color)
                for name, icon, color in DEFAULT_CATEGORIES
            ]
        )
        session.add(
            ActivityLog(
                room_id=room.id,
                actor_profile_id=user.id,
                action="room.created",
                entity_type="room",
                entity_id=room.id,
                new_values={"name": room.name, "currency": room.currency},
            )
        )
        await session.commit()
        return _summary(room, owner, 1, Decimal(0))

    @staticmethod
    async def get_room_detail(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
    ) -> RoomDetail:
        membership = await require_room_member(session, room_id, user.id)
        room = await repository.get_room(session, room_id)
        if room is None:
            raise AppError(
                code="room_not_found",
                message="Không tìm thấy phòng.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        rows = await repository.list_member_rows(session, room_id)
        members = [
            RoomMemberResponse(
                id=member.id,
                profile_id=profile.id,
                display_name=profile.display_name,
                email=profile.email,
                nickname=member.nickname,
                role=member.role,
                status=member.status,
                joined_at=member.joined_at,
            )
            for member, profile in rows
        ]
        total = await session.scalar(
            select(func.coalesce(func.sum(Expense.total_amount), 0)).where(
                Expense.room_id == room_id,
                Expense.status == ExpenseStatus.POSTED,
            )
        )
        summary = _summary(
            room,
            membership,
            sum(member.status == MembershipStatus.ACTIVE for member, _ in rows),
            total,
        )
        return RoomDetail(**summary.model_dump(), members=members)

    @staticmethod
    async def update_room(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        data: RoomUpdate,
    ) -> RoomDetail:
        await require_room_member(session, room_id, user.id, roles=MANAGER_ROLES)
        room = await repository.get_room(session, room_id)
        if room is None:
            raise AppError(
                code="room_not_found",
                message="Không tìm thấy phòng.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        old_values = {
            "name": room.name,
            "description": room.description,
            "currency": room.currency,
        }
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(
                room, field, value.upper() if field == "currency" and value else value
            )
        session.add(
            ActivityLog(
                room_id=room.id,
                actor_profile_id=user.id,
                action="room.updated",
                entity_type="room",
                entity_id=room.id,
                old_values=old_values,
                new_values=data.model_dump(exclude_unset=True),
            )
        )
        await session.commit()
        return await RoomService.get_room_detail(session, user, room_id)

    @staticmethod
    async def archive_room(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
    ) -> None:
        await require_room_member(session, room_id, user.id, roles={RoomRole.OWNER})
        room = await repository.get_room(session, room_id)
        if room is None:
            raise AppError(
                code="room_not_found",
                message="Không tìm thấy phòng.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        room.archived_at = datetime.now(UTC)
        session.add(
            ActivityLog(
                room_id=room.id,
                actor_profile_id=user.id,
                action="room.archived",
                entity_type="room",
                entity_id=room.id,
            )
        )
        await session.commit()

    @staticmethod
    async def create_invite(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        data: InviteCreate,
    ) -> RoomInvite:
        membership = await require_room_member(
            session,
            room_id,
            user.id,
            roles=MANAGER_ROLES,
        )
        invite = RoomInvite(
            room_id=room_id,
            created_by_member_id=membership.id,
            token=secrets.token_urlsafe(32),
            expires_at=datetime.now(UTC) + timedelta(hours=data.expires_in_hours),
            max_uses=data.max_uses,
        )
        session.add(invite)
        await session.commit()
        await session.refresh(invite)
        return invite

    @staticmethod
    async def join_room(
        session: AsyncSession,
        user: AuthenticatedUser,
        token: str,
    ) -> RoomMember:
        await UserService.get_or_create_profile(session, user)
        invite = await repository.get_invite_for_update(session, token)
        now = datetime.now(UTC)
        expires_at = invite.expires_at if invite is not None else None
        if expires_at is not None and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        if (
            invite is None
            or invite.status != InviteStatus.ACTIVE
            or expires_at is None
            or expires_at <= now
            or invite.use_count >= invite.max_uses
        ):
            raise AppError(
                code="invite_invalid",
                message="Lời mời đã hết hạn, bị thu hồi hoặc hết lượt sử dụng.",
                status_code=status.HTTP_410_GONE,
            )

        membership = await repository.get_membership(session, invite.room_id, user.id)
        if membership is not None:
            if membership.status == MembershipStatus.REMOVED:
                raise AppError(
                    code="membership_removed",
                    message="Bạn đã bị xóa khỏi phòng và không thể dùng lời mời này.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            membership.status = MembershipStatus.ACTIVE
            membership.joined_at = now
        else:
            membership = RoomMember(
                room_id=invite.room_id,
                profile_id=user.id,
                role=RoomRole.MEMBER,
                status=MembershipStatus.ACTIVE,
                joined_at=now,
            )
            session.add(membership)

        invite.use_count += 1
        if invite.use_count >= invite.max_uses:
            invite.status = InviteStatus.EXPIRED
        await session.flush()
        session.add(
            ActivityLog(
                room_id=invite.room_id,
                actor_profile_id=user.id,
                action="member.joined",
                entity_type="room_member",
                entity_id=membership.id,
            )
        )
        await session.commit()
        await session.refresh(membership)
        return membership

    @staticmethod
    async def update_member_role(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        member_id: UUID,
        data: MemberRoleUpdate,
    ) -> None:
        actor = await require_room_member(
            session, room_id, user.id, roles=MANAGER_ROLES
        )
        member = await session.get(RoomMember, member_id)
        if member is None or member.room_id != room_id:
            raise AppError(
                code="member_not_found",
                message="Không tìm thấy thành viên.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        if data.role == RoomRole.OWNER or member.role == RoomRole.OWNER:
            raise AppError(
                code="owner_transfer_required",
                message="Cần dùng luồng chuyển chủ phòng riêng.",
                status_code=status.HTTP_409_CONFLICT,
            )
        if actor.role == RoomRole.ADMIN and data.role != RoomRole.MEMBER:
            raise AppError(
                code="owner_role_required",
                message="Chỉ chủ phòng được cấp quyền quản trị.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        old_role = member.role
        member.role = data.role
        session.add(
            ActivityLog(
                room_id=room_id,
                actor_profile_id=user.id,
                action="member.role_updated",
                entity_type="room_member",
                entity_id=member.id,
                old_values={"role": old_role.value},
                new_values={"role": data.role.value},
            )
        )
        await session.commit()

    @staticmethod
    async def leave_room(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
    ) -> None:
        membership = await require_room_member(session, room_id, user.id)
        if membership.role == RoomRole.OWNER:
            raise AppError(
                code="owner_cannot_leave",
                message="Chủ phòng cần chuyển quyền trước khi rời phòng.",
                status_code=status.HTTP_409_CONFLICT,
            )
        membership.status = MembershipStatus.LEFT
        session.add(
            ActivityLog(
                room_id=room_id,
                actor_profile_id=user.id,
                action="member.left",
                entity_type="room_member",
                entity_id=membership.id,
            )
        )
        await session.commit()

    @staticmethod
    async def remove_member(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        member_id: UUID,
    ) -> None:
        await require_room_member(session, room_id, user.id, roles=MANAGER_ROLES)
        member = await session.get(RoomMember, member_id)
        if member is None or member.room_id != room_id:
            raise AppError(
                code="member_not_found",
                message="Không tìm thấy thành viên.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        if member.role == RoomRole.OWNER:
            raise AppError(
                code="owner_cannot_be_removed",
                message="Không thể xóa chủ phòng.",
                status_code=status.HTTP_409_CONFLICT,
            )
        member.status = MembershipStatus.REMOVED
        session.add(
            ActivityLog(
                room_id=room_id,
                actor_profile_id=user.id,
                action="member.removed",
                entity_type="room_member",
                entity_id=member.id,
            )
        )
        await session.commit()

    @staticmethod
    async def list_categories(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
    ) -> list[Category]:
        await require_room_member(session, room_id, user.id)
        return await repository.list_categories(session, room_id)

    @staticmethod
    async def create_category(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        data: CategoryCreate,
    ) -> Category:
        await require_room_member(session, room_id, user.id, roles=MANAGER_ROLES)
        category = Category(room_id=room_id, **data.model_dump())
        session.add(category)
        try:
            await session.flush()
            session.add(
                ActivityLog(
                    room_id=room_id,
                    actor_profile_id=user.id,
                    action="category.created",
                    entity_type="category",
                    entity_id=category.id,
                    new_values={"name": category.name},
                )
            )
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            raise AppError(
                code="category_name_exists",
                message="Tên danh mục đã tồn tại trong phòng.",
                status_code=status.HTTP_409_CONFLICT,
            ) from exc
        await session.refresh(category)
        return category

    @staticmethod
    async def update_category(
        session: AsyncSession,
        user: AuthenticatedUser,
        room_id: UUID,
        category_id: UUID,
        data: CategoryUpdate,
    ) -> Category:
        await require_room_member(session, room_id, user.id, roles=MANAGER_ROLES)
        category = await session.get(Category, category_id)
        if category is None or category.room_id != room_id:
            raise AppError(
                code="category_not_found",
                message="Không tìm thấy danh mục.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        old_values = {
            "name": category.name,
            "is_active": category.is_active,
        }
        new_values = data.model_dump(exclude_unset=True)
        for field, value in new_values.items():
            setattr(category, field, value)
        session.add(
            ActivityLog(
                room_id=room_id,
                actor_profile_id=user.id,
                action="category.updated",
                entity_type="category",
                entity_id=category.id,
                old_values=old_values,
                new_values=new_values,
            )
        )
        await session.commit()
        await session.refresh(category)
        return category
