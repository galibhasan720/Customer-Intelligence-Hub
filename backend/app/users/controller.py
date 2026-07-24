"""Users controller."""

from __future__ import annotations

from app.users.models import Profile
from app.users.schemas import ProfileOut


def me(user: Profile) -> ProfileOut:
    return ProfileOut.model_validate(user)
