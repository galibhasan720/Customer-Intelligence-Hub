"""Notifications repository."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.notifications.models import Notification


class NotificationsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_user(self, user_id: UUID, *, unread_only: bool = False) -> list[Notification]:
        stmt = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            stmt = stmt.where(Notification.status != "read")
        stmt = stmt.order_by(Notification.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def get_for_user(self, notification_id: UUID, user_id: UUID) -> Notification | None:
        stmt = select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )
        return self.db.scalars(stmt).first()

    def create(self, notification: Notification) -> Notification:
        self.db.add(notification)
        self.db.flush()
        return notification
