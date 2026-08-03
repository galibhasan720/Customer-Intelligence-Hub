"""Service layer for the admin domain."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.admin.repository import AdminRepository
from app.admin.schemas import (
    AdminBookingOut,
    AdminUserOut,
    AdminUserUpdate,
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
)
from app.bookings.models import Booking
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.core.roles import UserRole
from app.events.models import Category
from app.events.schemas import EventOut
from app.events.service import EventsService
from app.users.models import Profile


class AdminService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = AdminRepository(db)
        self.events_service = EventsService(db)

    def list_users(self) -> list[AdminUserOut]:
        return [AdminUserOut.model_validate(u) for u in self.repository.list_users()]

    def update_user(
        self, actor: Profile, user_id: UUID, payload: AdminUserUpdate
    ) -> AdminUserOut:
        user = self.repository.get_user(user_id)
        if user is None:
            raise NotFoundError("User not found")

        data = payload.model_dump(exclude_unset=True)
        if not data:
            return AdminUserOut.model_validate(user)

        if actor.id == user.id:
            if "role" in data and data["role"] != user.role:
                raise ForbiddenError("Admins cannot change their own role")
            if "is_active" in data and data["is_active"] is False:
                raise ForbiddenError("Admins cannot deactivate their own account")

        if "role" in data and data["role"] not in UserRole.ALL:
            raise ConflictError("Invalid role")

        for key, value in data.items():
            setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return AdminUserOut.model_validate(user)

    def list_categories(self) -> list[CategoryOut]:
        return [
            CategoryOut.model_validate(c) for c in self.repository.list_categories()
        ]

    def create_category(self, payload: CategoryCreate) -> CategoryOut:
        existing = self.repository.get_category_by_name(payload.name.strip())
        if existing is not None:
            raise ConflictError("Category name already exists")
        category = Category(
            name=payload.name.strip(),
            description=payload.description,
            is_active=payload.is_active,
        )
        self.repository.create_category(category)
        self.db.commit()
        self.db.refresh(category)
        return CategoryOut.model_validate(category)

    def update_category(
        self, category_id: UUID, payload: CategoryUpdate
    ) -> CategoryOut:
        category = self.repository.get_category(category_id)
        if category is None:
            raise NotFoundError("Category not found")
        data = payload.model_dump(exclude_unset=True)
        if "name" in data and data["name"] is not None:
            name = data["name"].strip()
            other = self.repository.get_category_by_name(name)
            if other is not None and other.id != category.id:
                raise ConflictError("Category name already exists")
            data["name"] = name
        for key, value in data.items():
            setattr(category, key, value)
        self.db.commit()
        self.db.refresh(category)
        return CategoryOut.model_validate(category)

    def list_bookings(self) -> list[AdminBookingOut]:
        return [self._booking_to_out(b) for b in self.repository.list_bookings()]

    def force_cancel_booking(self, booking_id: UUID) -> AdminBookingOut:
        booking = self.repository.get_booking(booking_id)
        if booking is None:
            raise NotFoundError("Booking not found")
        if booking.status == "Cancelled":
            return self._booking_to_out(booking)
        booking.status = "Cancelled"
        for link in booking.booking_seats:
            if link.seat is not None:
                link.seat.status = "Available"
        for link in list(booking.booking_seats):
            self.db.delete(link)
        self.db.commit()
        refreshed = self.repository.get_booking(booking_id)
        assert refreshed is not None
        return self._booking_to_out(refreshed)

    def list_events(self) -> list[EventOut]:
        events = self.repository.list_events()
        return [self.events_service._to_out(e) for e in events]  # noqa: SLF001

    def _booking_to_out(self, booking: Booking) -> AdminBookingOut:
        event = booking.event
        user = booking.user
        seat_numbers: list[str] = []
        seat_ids: list[UUID] = []
        total = 0.0
        base = float(event.price) if event else 0.0
        for link in booking.booking_seats:
            if link.seat is None:
                continue
            seat_numbers.append(link.seat.seat_number)
            seat_ids.append(link.seat.id)
            total += base * 2 if link.seat.category == "VIP" else base
        return AdminBookingOut(
            id=booking.id,
            event_id=booking.event_id,
            event_title=event.title if event else "",
            venue=event.venue if event else "",
            event_date=event.event_date if event else booking.created_at,
            seats=seat_numbers,
            seat_ids=seat_ids,
            total=total,
            status=booking.status,
            booked_at=booking.created_at,
            user_id=booking.user_id,
            user_email=user.email if user else "",
            user_name=user.full_name if user else "",
        )
