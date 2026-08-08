"""HTTP router for bookings."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.bookings import controller
from app.bookings.schemas import BookingCreate, BookingOut, BookingUpdate
from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.users.models import Profile

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("/me", response_model=list[BookingOut])
def my_bookings(
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[BookingOut]:
    return controller.list_mine(db, user)


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: UUID,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingOut:
    return controller.get(db, user, booking_id)


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingOut:
    return controller.create(db, user, payload)


@router.patch("/{booking_id}", response_model=BookingOut)
def update_booking(
    booking_id: UUID,
    payload: BookingUpdate,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingOut:
    return controller.update(db, user, booking_id, payload)


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: UUID,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingOut:
    return controller.cancel(db, user, booking_id)
