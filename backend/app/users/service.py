"""Users service."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, UnauthorizedError
from app.core.security import hash_password, verify_password
from app.users.models import Profile
from app.users.repository import UsersRepository
from app.users.schemas import AdminUserUpdate, PasswordChange, ProfileOut, ProfileUpdate


class UsersService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = UsersRepository(db)

    def to_out(self, user: Profile) -> ProfileOut:
        return ProfileOut(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            organization_name=user.organization_name,
            bio=user.bio,
            phone=user.phone,
            website=user.website,
            city=user.city,
            address=user.address,
            verified=bool(user.verified),
            events_created=self.repository.events_created(user.id),
            total_bookings=self.repository.total_bookings(user.id),
            member_since=user.created_at,
        )

    def me(self, user: Profile) -> ProfileOut:
        return self.to_out(user)

    def update_me(self, user: Profile, payload: ProfileUpdate) -> ProfileOut:
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return self.to_out(user)

    def change_password(self, user: Profile, payload: PasswordChange) -> None:
        if not verify_password(payload.current_password, user.password_hash):
            raise UnauthorizedError("Current password is incorrect")
        user.password_hash = hash_password(payload.new_password)
        self.db.commit()

    def list_users(self) -> list[ProfileOut]:
        return [self.to_out(u) for u in self.repository.list_all()]

    def get_user(self, user_id: UUID) -> ProfileOut:
        user = self.repository.get(user_id)
        if user is None:
            raise NotFoundError("User not found")
        return self.to_out(user)

    def admin_update(self, actor: Profile, user_id: UUID, payload: AdminUserUpdate) -> ProfileOut:
        user = self.repository.get(user_id)
        if user is None:
            raise NotFoundError("User not found")
        data = payload.model_dump(exclude_unset=True)
        if "email" in data and data["email"]:
            from sqlalchemy import select

            existing = self.db.scalar(
                select(Profile).where(Profile.email == data["email"], Profile.id != user.id)
            )
            if existing is not None:
                raise ConflictError("Email already in use")
        if "role" in data and user.id == actor.id and data["role"] != "admin":
            raise ForbiddenError("Cannot demote your own admin account")
        for key, value in data.items():
            setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return self.to_out(user)

    def deactivate(self, actor: Profile, user_id: UUID) -> None:
        if actor.id == user_id:
            raise ForbiddenError("Cannot deactivate your own account")
        user = self.repository.get(user_id)
        if user is None:
            raise NotFoundError("User not found")
        user.is_active = False
        self.db.commit()
