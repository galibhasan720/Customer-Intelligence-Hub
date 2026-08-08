"""Notifications service."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.notifications.models import Notification
from app.notifications.repository import NotificationsRepository
from app.notifications.schemas import NotificationOut
from app.users.models import Profile


def notify(
    db: Session,
    *,
    user_id: UUID,
    ntype: str,
    title: str,
    message: str,
    event_id: UUID | None = None,
    booking_id: UUID | None = None,
) -> Notification:
    row = Notification(
        user_id=user_id,
        event_id=event_id,
        booking_id=booking_id,
        type=ntype,
        title=title,
        message=message,
        status="sent",
        sent_at=datetime.now(timezone.utc),
    )
    db.add(row)
    db.flush()
    return row


class NotificationsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = NotificationsRepository(db)

    def _to_out(self, row: Notification) -> NotificationOut:
        return NotificationOut(
            id=row.id,
            type=row.type,
            title=row.title or "",
            message=row.message,
            status=row.status,
            read=row.status == "read",
            created_at=row.created_at,
            event_id=row.event_id,
            booking_id=row.booking_id,
        )

    def list_mine(self, user: Profile, *, unread_only: bool = False) -> list[NotificationOut]:
        return [
            self._to_out(n)
            for n in self.repository.list_for_user(user.id, unread_only=unread_only)
        ]

    def mark_read(self, user: Profile, notification_id: UUID) -> NotificationOut:
        row = self.repository.get_for_user(notification_id, user.id)
        if row is None:
            raise NotFoundError("Notification not found")
        row.status = "read"
        self.db.commit()
        self.db.refresh(row)
        return self._to_out(row)

    def mark_all_read(self, user: Profile) -> None:
        for row in self.repository.list_for_user(user.id, unread_only=True):
            row.status = "read"
        self.db.commit()

    def clear_all(self, user: Profile) -> None:
        for row in self.repository.list_for_user(user.id):
            self.db.delete(row)
        self.db.commit()

    def send_reminders(self) -> int:
        """One-shot reminder for published events in the next 48 hours."""
        from datetime import timedelta

        from sqlalchemy import select

        from app.bookings.models import Booking
        from app.events.models import Event

        now = datetime.now(timezone.utc)
        soon = now + timedelta(hours=48)
        events = list(
            self.db.scalars(
                select(Event).where(
                    Event.status == "Published",
                    Event.event_date >= now,
                    Event.event_date <= soon,
                )
            ).all()
        )
        count = 0
        for event in events:
            bookings = list(
                self.db.scalars(
                    select(Booking).where(
                        Booking.event_id == event.id,
                        Booking.status.in_(("Confirmed", "Pending")),
                    )
                ).all()
            )
            for booking in bookings:
                notify(
                    self.db,
                    user_id=booking.user_id,
                    ntype="event_reminder",
                    title="Event reminder",
                    message=f"{event.title} is coming up soon. Don't forget your tickets!",
                    event_id=event.id,
                    booking_id=booking.id,
                )
                count += 1
        self.db.commit()
        return count
