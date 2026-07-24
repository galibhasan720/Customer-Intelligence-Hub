"""Venues controller."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.users.models import Profile
from app.venues.schemas import (
    HallBookingCreate,
    HallBookingOut,
    HallBookingUpdate,
    HallOut,
    VenueOut,
)
from app.venues.service import VenuesService


def list_venues(db: Session) -> list[VenueOut]:
    return VenuesService(db).list_venues()


def get_venue(db: Session, venue_id: UUID) -> VenueOut:
    return VenuesService(db).get_venue(venue_id)


def list_halls(db: Session, venue_id: UUID) -> list[HallOut]:
    return VenuesService(db).list_halls(venue_id)


def list_my_bookings(db: Session, user: Profile) -> list[HallBookingOut]:
    return VenuesService(db).list_my_bookings(user)


def create_booking(
    db: Session, user: Profile, payload: HallBookingCreate
) -> HallBookingOut:
    return VenuesService(db).create_booking(user, payload)


def update_booking(
    db: Session, user: Profile, booking_id: UUID, payload: HallBookingUpdate
) -> HallBookingOut:
    return VenuesService(db).update_booking(user, booking_id, payload)


def cancel_booking(db: Session, user: Profile, booking_id: UUID) -> HallBookingOut:
    return VenuesService(db).cancel_booking(user, booking_id)
