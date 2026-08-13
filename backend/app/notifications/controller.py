"""Notifications controller."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.notifications.schemas import NotificationOut
from app.notifications.service import NotificationsService
from app.users.models import Profile


def list_mine(
    db: Session, user: Profile, *, unread_only: bool = False
) -> list[NotificationOut]:
    return NotificationsService(db).list_mine(user, unread_only=unread_only)


def mark_read(db: Session, user: Profile, notification_id: UUID) -> NotificationOut:
    return NotificationsService(db).mark_read(user, notification_id)


def mark_all_read(db: Session, user: Profile) -> None:
    NotificationsService(db).mark_all_read(user)


def clear_all(db: Session, user: Profile) -> None:
    NotificationsService(db).clear_all(user)


def send_reminders(db: Session) -> dict[str, int]:
    return {"created": NotificationsService(db).send_reminders()}
