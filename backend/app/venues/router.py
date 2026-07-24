"""HTTP router for venues and hall bookings."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.users.models import Profile
from app.venues import controller
from app.venues.schemas import (
    HallBookingCreate,
    HallBookingOut,
    HallBookingUpdate,
    HallOut,
    VenueOut,
)

router = APIRouter(tags=["venues"])


@router.get("/venues", response_model=list[VenueOut])
def list_venues(db: Session = Depends(get_db)) -> list[VenueOut]:
    return controller.list_venues(db)


@router.get("/venues/{venue_id}", response_model=VenueOut)
def get_venue(venue_id: UUID, db: Session = Depends(get_db)) -> VenueOut:
    return controller.get_venue(db, venue_id)


@router.get("/venues/{venue_id}/halls", response_model=list[HallOut])
def list_halls(venue_id: UUID, db: Session = Depends(get_db)) -> list[HallOut]:
    return controller.list_halls(db, venue_id)


@router.get("/hall-bookings/me", response_model=list[HallBookingOut])
def my_hall_bookings(
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[HallBookingOut]:
    return controller.list_my_bookings(db, user)


@router.post(
    "/hall-bookings",
    response_model=HallBookingOut,
    status_code=status.HTTP_201_CREATED,
)
def create_hall_booking(
    payload: HallBookingCreate,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HallBookingOut:
    return controller.create_booking(db, user, payload)


@router.patch("/hall-bookings/{booking_id}", response_model=HallBookingOut)
def update_hall_booking(
    booking_id: UUID,
    payload: HallBookingUpdate,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HallBookingOut:
    return controller.update_booking(db, user, booking_id, payload)


@router.post("/hall-bookings/{booking_id}/cancel", response_model=HallBookingOut)
def cancel_hall_booking(
    booking_id: UUID,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HallBookingOut:
    return controller.cancel_booking(db, user, booking_id)
