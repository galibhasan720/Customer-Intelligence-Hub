"""HTTP router for the admin domain."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.admin import controller
from app.admin.schemas import (
    AdminBookingOut,
    AdminUserOut,
    AdminUserUpdate,
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
)
from app.core.dependencies import require_admin
from app.database.session import get_db
from app.events.schemas import EventOut
from app.users.models import Profile

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[AdminUserOut]:
    return controller.list_users(db)


@router.patch("/users/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    actor: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminUserOut:
    return controller.update_user(db, actor, user_id, payload)


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[CategoryOut]:
    return controller.list_categories(db)


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(
    payload: CategoryCreate,
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CategoryOut:
    return controller.create_category(db, payload)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CategoryOut:
    return controller.update_category(db, category_id, payload)


@router.get("/bookings", response_model=list[AdminBookingOut])
def list_bookings(
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[AdminBookingOut]:
    return controller.list_bookings(db)


@router.post("/bookings/{booking_id}/force-cancel", response_model=AdminBookingOut)
def force_cancel_booking(
    booking_id: UUID,
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminBookingOut:
    return controller.force_cancel_booking(db, booking_id)


@router.get("/events", response_model=list[EventOut])
def list_events(
    _: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[EventOut]:
    return controller.list_events(db)
