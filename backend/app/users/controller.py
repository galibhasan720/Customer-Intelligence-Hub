"""Users controller."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.users.models import Profile
from app.users.schemas import AdminUserUpdate, PasswordChange, ProfileOut, ProfileUpdate
from app.users.service import UsersService


def me(db: Session, user: Profile) -> ProfileOut:
    return UsersService(db).me(user)


def update_me(db: Session, user: Profile, payload: ProfileUpdate) -> ProfileOut:
    return UsersService(db).update_me(user, payload)


def change_password(db: Session, user: Profile, payload: PasswordChange) -> None:
    UsersService(db).change_password(user, payload)


def list_users(db: Session) -> list[ProfileOut]:
    return UsersService(db).list_users()


def get_user(db: Session, user_id: UUID) -> ProfileOut:
    return UsersService(db).get_user(user_id)


def admin_update(
    db: Session, actor: Profile, user_id: UUID, payload: AdminUserUpdate
) -> ProfileOut:
    return UsersService(db).admin_update(actor, user_id, payload)


def deactivate(db: Session, actor: Profile, user_id: UUID) -> None:
    UsersService(db).deactivate(actor, user_id)
