"""FastAPI auth dependencies."""

from __future__ import annotations

from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.roles import UserRole, is_organizer_or_admin
from app.core.security import decode_access_token
from app.database.session import get_db
from app.users.models import Profile


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Profile:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
        user_id = UUID(payload["sub"])
    except Exception as exc:  # noqa: BLE001
        raise UnauthorizedError("Invalid or expired token") from exc

    user = db.get(Profile, user_id)
    if user is None or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    return user


def require_roles(*roles: str) -> Callable[[Profile], Profile]:
    """Return a dependency that requires the current user to have one of *roles*."""

    allowed = set(roles)

    def _dependency(user: Profile = Depends(get_current_user)) -> Profile:
        if user.role not in allowed:
            raise ForbiddenError("Insufficient permissions for this action")
        return user

    return _dependency


def require_organizer(user: Profile = Depends(get_current_user)) -> Profile:
    if not is_organizer_or_admin(user.role):
        raise ForbiddenError("Organizer role required")
    return user


def require_admin(user: Profile = Depends(get_current_user)) -> Profile:
    if user.role != UserRole.ADMIN:
        raise ForbiddenError("Admin role required")
    return user
