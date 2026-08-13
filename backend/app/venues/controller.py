"""Venues controller."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.users.models import Profile
from app.venues.schemas import (
    HallBookingCreate,
    HallBookingOut,
    HallBookingUpdate,
    HallCreate,
    HallOut,
    HallUpdate,
    VenueCreate,
    VenueOut,
    VenueUpdate,
)
from app.venues.service import VenuesService


def list_venues(db: Session) -> list[VenueOut]:
    return VenuesService(db).list_venues()


def get_venue(db: Session, venue_id: UUID) -> VenueOut:
    return VenuesService(db).get_venue(venue_id)


def create_venue(db: Session, payload: VenueCreate) -> VenueOut:
    return VenuesService(db).create_venue(payload)


def update_venue(db: Session, venue_id: UUID, payload: VenueUpdate) -> VenueOut:
    return VenuesService(db).update_venue(venue_id, payload)


def delete_venue(db: Session, venue_id: UUID) -> None:
    VenuesService(db).delete_venue(venue_id)


def list_halls(db: Session, venue_id: UUID) -> list[HallOut]:
    return VenuesService(db).list_halls(venue_id)


def get_hall(db: Session, hall_id: UUID) -> HallOut:
    return VenuesService(db).get_hall(hall_id)


def create_hall(db: Session, venue_id: UUID, payload: HallCreate) -> HallOut:
    return VenuesService(db).create_hall(venue_id, payload)


def update_hall(db: Session, hall_id: UUID, payload: HallUpdate) -> HallOut:
    return VenuesService(db).update_hall(hall_id, payload)


def delete_hall(db: Session, hall_id: UUID) -> None:
    VenuesService(db).delete_hall(hall_id)


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
