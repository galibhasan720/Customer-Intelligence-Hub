"""Controller layer for the admin domain."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.admin.schemas import (
    AdminBookingOut,
    AdminUserOut,
    AdminUserUpdate,
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
)
from app.admin.service import AdminService
from app.events.schemas import EventOut
from app.users.models import Profile


def list_users(db: Session) -> list[AdminUserOut]:
    return AdminService(db).list_users()


def update_user(
    db: Session, actor: Profile, user_id: UUID, payload: AdminUserUpdate
) -> AdminUserOut:
    return AdminService(db).update_user(actor, user_id, payload)


def list_categories(db: Session) -> list[CategoryOut]:
    return AdminService(db).list_categories()


def create_category(db: Session, payload: CategoryCreate) -> CategoryOut:
    return AdminService(db).create_category(payload)


def update_category(
    db: Session, category_id: UUID, payload: CategoryUpdate
) -> CategoryOut:
    return AdminService(db).update_category(category_id, payload)


def list_bookings(db: Session) -> list[AdminBookingOut]:
    return AdminService(db).list_bookings()


def force_cancel_booking(db: Session, booking_id: UUID) -> AdminBookingOut:
    return AdminService(db).force_cancel_booking(booking_id)


def list_events(db: Session) -> list[EventOut]:
    return AdminService(db).list_events()
