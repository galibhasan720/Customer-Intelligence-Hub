"""Repository layer for the admin domain."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.bookings.models import Booking, BookingSeat
from app.events.models import Category, Event
from app.users.models import Profile


class AdminRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_users(self) -> list[Profile]:
        stmt = select(Profile).order_by(Profile.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def get_user(self, user_id: UUID) -> Profile | None:
        return self.db.get(Profile, user_id)

    def list_categories(self) -> list[Category]:
        stmt = select(Category).order_by(Category.name.asc())
        return list(self.db.scalars(stmt).all())

    def get_category(self, category_id: UUID) -> Category | None:
        return self.db.get(Category, category_id)

    def get_category_by_name(self, name: str) -> Category | None:
        return self.db.scalar(select(Category).where(Category.name == name))

    def create_category(self, category: Category) -> Category:
        self.db.add(category)
        self.db.flush()
        return category

    def list_bookings(self) -> list[Booking]:
        stmt = (
            select(Booking)
            .options(
                joinedload(Booking.event),
                joinedload(Booking.user),
                joinedload(Booking.booking_seats).joinedload(BookingSeat.seat),
            )
            .order_by(Booking.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_booking(self, booking_id: UUID) -> Booking | None:
        stmt = (
            select(Booking)
            .where(Booking.id == booking_id)
            .options(
                joinedload(Booking.event),
                joinedload(Booking.user),
                joinedload(Booking.booking_seats).joinedload(BookingSeat.seat),
            )
        )
        return self.db.scalars(stmt).unique().first()

    def list_events(self) -> list[Event]:
        stmt = (
            select(Event)
            .options(joinedload(Event.category), joinedload(Event.seats))
            .order_by(Event.event_date.desc())
        )
        return list(self.db.scalars(stmt).unique().all())
