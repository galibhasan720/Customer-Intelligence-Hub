"""FastAPI auth dependencies."""

from __future__ import annotations

from collections.abc import Callable
from uuid import UUID

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.database.session import get_db
from app.users.models import Profile


def _load_user_from_bearer(authorization: str | None, db: Session) -> Profile:
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


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Profile:
    return _load_user_from_bearer(authorization, db)


def get_current_user_optional(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Profile | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    try:
        return _load_user_from_bearer(authorization, db)
    except UnauthorizedError:
        return None


def require_organizer(user: Profile = Depends(get_current_user)) -> Profile:
    if user.role not in ("organizer", "admin"):
        raise ForbiddenError("Organizer role required")
    return user


def require_admin(user: Profile = Depends(get_current_user)) -> Profile:
    if user.role != "admin":
        raise ForbiddenError("Admin role required")
    return user


def require_roles(*roles: str) -> Callable[..., Profile]:
    def _dep(user: Profile = Depends(get_current_user)) -> Profile:
        if user.role not in roles:
            raise ForbiddenError("Insufficient role")
        return user

    return _dep
