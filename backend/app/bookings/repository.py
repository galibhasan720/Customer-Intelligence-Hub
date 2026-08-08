"""Bookings repository."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.bookings.models import Booking, BookingSeat


class BookingsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _options(self):
        return (
            joinedload(Booking.event),
            joinedload(Booking.booking_seats).joinedload(BookingSeat.seat),
        )

    def list_for_user(self, user_id: UUID) -> list[Booking]:
        stmt = (
            select(Booking)
            .where(Booking.user_id == user_id)
            .options(*self._options())
            .order_by(Booking.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def list_all(self) -> list[Booking]:
        stmt = select(Booking).options(*self._options()).order_by(Booking.created_at.desc())
        return list(self.db.scalars(stmt).unique().all())

    def get(self, booking_id: UUID) -> Booking | None:
        stmt = select(Booking).where(Booking.id == booking_id).options(*self._options())
        return self.db.scalars(stmt).unique().first()

    def get_for_user(self, booking_id: UUID, user_id: UUID) -> Booking | None:
        stmt = (
            select(Booking)
            .where(Booking.id == booking_id, Booking.user_id == user_id)
            .options(*self._options())
        )
        return self.db.scalars(stmt).unique().first()

    def create(self, booking: Booking) -> Booking:
        self.db.add(booking)
        self.db.flush()
        return booking
