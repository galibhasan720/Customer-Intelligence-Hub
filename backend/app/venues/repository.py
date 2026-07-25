"""Venues data access."""

from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.venues.models import Hall, HallBooking, Venue


class VenuesRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_venues(self) -> list[Venue]:
        stmt = (
            select(Venue)
            .where(Venue.is_active.is_(True))
            .options(joinedload(Venue.halls))
            .order_by(Venue.name.asc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_venue(self, venue_id: UUID) -> Venue | None:
        stmt = (
            select(Venue)
            .where(Venue.id == venue_id)
            .options(joinedload(Venue.halls))
        )
        return self.db.scalars(stmt).unique().first()

    def list_halls(self, venue_id: UUID) -> list[Hall]:
        stmt = (
            select(Hall)
            .where(Hall.venue_id == venue_id)
            .order_by(Hall.name.asc())
        )
        return list(self.db.scalars(stmt).all())

    def get_hall(self, hall_id: UUID) -> Hall | None:
        return self.db.get(Hall, hall_id)

    def hall_count(self, venue_id: UUID) -> int:
        return int(
            self.db.scalar(
                select(func.count()).select_from(Hall).where(Hall.venue_id == venue_id)
            )
            or 0
        )

    def list_bookings_for_user(self, user_id: UUID) -> list[HallBooking]:
        stmt = (
            select(HallBooking)
            .where(HallBooking.user_id == user_id)
            .options(joinedload(HallBooking.venue), joinedload(HallBooking.hall))
            .order_by(HallBooking.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_booking_for_user(
        self, booking_id: UUID, user_id: UUID
    ) -> HallBooking | None:
        stmt = (
            select(HallBooking)
            .where(HallBooking.id == booking_id, HallBooking.user_id == user_id)
            .options(joinedload(HallBooking.venue), joinedload(HallBooking.hall))
        )
        return self.db.scalars(stmt).unique().first()

    def list_conflicting_bookings(
        self,
        hall_id: UUID,
        booking_date: date,
        exclude_booking_id: UUID | None = None,
    ) -> list[HallBooking]:
        stmt = select(HallBooking).where(
            HallBooking.hall_id == hall_id,
            HallBooking.booking_date == booking_date,
            HallBooking.status != "Cancelled",
        )
        if exclude_booking_id is not None:
            stmt = stmt.where(HallBooking.id != exclude_booking_id)
        return list(self.db.scalars(stmt).all())

    def create_booking(self, booking: HallBooking) -> HallBooking:
        self.db.add(booking)
        self.db.flush()
        return booking
