"""HTTP router for users."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.users import controller
from app.users.models import Profile
from app.users.schemas import ProfileOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=ProfileOut)
def get_me(user: Profile = Depends(get_current_user)) -> ProfileOut:
    return controller.me(user)
