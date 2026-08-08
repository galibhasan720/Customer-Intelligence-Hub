"""HTTP router for notifications."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.notifications import controller
from app.notifications.schemas import NotificationOut
from app.users.models import Profile

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = Query(default=False),
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NotificationOut]:
    return controller.list_mine(db, user, unread_only=unread_only)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: UUID,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationOut:
    return controller.mark_read(db, user, notification_id)


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    controller.mark_all_read(db, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_all(
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    controller.clear_all(db, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
