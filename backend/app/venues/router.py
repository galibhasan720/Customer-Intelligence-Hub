"""HTTP router for venues and hall bookings."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_organizer
from app.database.session import get_db
from app.users.models import Profile
from app.venues import controller
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

router = APIRouter(tags=["venues"])


@router.get("/venues", response_model=list[VenueOut])
def list_venues(db: Session = Depends(get_db)) -> list[VenueOut]:
    return controller.list_venues(db)


@router.post("/venues", response_model=VenueOut, status_code=status.HTTP_201_CREATED)
def create_venue(
    payload: VenueCreate,
    _: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> VenueOut:
    return controller.create_venue(db, payload)


@router.get("/venues/{venue_id}", response_model=VenueOut)
def get_venue(venue_id: UUID, db: Session = Depends(get_db)) -> VenueOut:
    return controller.get_venue(db, venue_id)


@router.patch("/venues/{venue_id}", response_model=VenueOut)
def update_venue(
    venue_id: UUID,
    payload: VenueUpdate,
    _: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> VenueOut:
    return controller.update_venue(db, venue_id, payload)


@router.delete("/venues/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venue(
    venue_id: UUID,
    _: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> Response:
    controller.delete_venue(db, venue_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/venues/{venue_id}/halls", response_model=list[HallOut])
def list_halls(venue_id: UUID, db: Session = Depends(get_db)) -> list[HallOut]:
    return controller.list_halls(db, venue_id)


@router.post(
    "/venues/{venue_id}/halls",
    response_model=HallOut,
    status_code=status.HTTP_201_CREATED,
)
def create_hall(
    venue_id: UUID,
    payload: HallCreate,
    _: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> HallOut:
    return controller.create_hall(db, venue_id, payload)


@router.get("/halls/{hall_id}", response_model=HallOut)
def get_hall(hall_id: UUID, db: Session = Depends(get_db)) -> HallOut:
    return controller.get_hall(db, hall_id)


@router.patch("/halls/{hall_id}", response_model=HallOut)
def update_hall(
    hall_id: UUID,
    payload: HallUpdate,
    _: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> HallOut:
    return controller.update_hall(db, hall_id, payload)


@router.delete("/halls/{hall_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hall(
    hall_id: UUID,
    _: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> Response:
    controller.delete_hall(db, hall_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
