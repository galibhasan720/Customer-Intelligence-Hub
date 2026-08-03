"""Repository layer for the analytics domain."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.bookings.models import Booking, BookingSeat
from app.events.models import Event


class AnalyticsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_organizer_events(self, organizer_id: UUID) -> list[Event]:
        stmt = (
            select(Event)
            .where(Event.organizer_id == organizer_id)
            .options(joinedload(Event.category), joinedload(Event.seats))
            .order_by(Event.event_date.asc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def list_organizer_bookings(self, organizer_id: UUID) -> list[Booking]:
        stmt = (
            select(Booking)
            .join(Event, Booking.event_id == Event.id)
            .where(Event.organizer_id == organizer_id)
            .options(
                joinedload(Booking.event).joinedload(Event.category),
                joinedload(Booking.booking_seats).joinedload(BookingSeat.seat),
            )
            .order_by(Booking.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())
