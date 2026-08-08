"""HTTP router for users."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.users import controller
from app.users.models import Profile
from app.users.schemas import PasswordChange, ProfileOut, ProfileUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=ProfileOut)
def get_me(
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileOut:
    return controller.me(db, user)


@router.patch("/me", response_model=ProfileOut)
def patch_me(
    payload: ProfileUpdate,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileOut:
    return controller.update_me(db, user, payload)


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    controller.change_password(db, user, payload)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
