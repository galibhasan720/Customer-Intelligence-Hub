"""Bookings controller."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.bookings.schemas import BookingCreate, BookingOut
from app.bookings.service import BookingsService
from app.users.models import Profile


def list_mine(db: Session, user: Profile) -> list[BookingOut]:
    return BookingsService(db).list_mine(user)


def create(db: Session, user: Profile, payload: BookingCreate) -> BookingOut:
    return BookingsService(db).create(user, payload)


def cancel(db: Session, user: Profile, booking_id: UUID) -> BookingOut:
    return BookingsService(db).cancel(user, booking_id)
