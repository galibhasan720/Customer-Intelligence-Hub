"""Events service."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.events.models import Category, Event
from app.events.repository import EventsRepository
from app.events.schemas import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    EventCreate,
    EventOut,
    EventUpdate,
)
from app.seats.models import Seat
from app.users.models import Profile

DEFAULT_IMAGE = (
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"
)


class EventsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = EventsRepository(db)

    def list_categories(self) -> list[CategoryOut]:
        return [CategoryOut.model_validate(c) for c in self.repository.list_categories()]

    def create_category(self, payload: CategoryCreate) -> CategoryOut:
        if self.repository.get_category_by_name(payload.name):
            raise ConflictError("Category already exists")
        row = Category(name=payload.name, description=payload.description, is_active=payload.is_active)
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return CategoryOut.model_validate(row)

    def update_category(self, category_id: UUID, payload: CategoryUpdate) -> CategoryOut:
        row = self.repository.get_category(category_id)
        if row is None:
            raise NotFoundError("Category not found")
        data = payload.model_dump(exclude_unset=True)
        if "name" in data and data["name"]:
            existing = self.repository.get_category_by_name(data["name"])
            if existing is not None and existing.id != row.id:
                raise ConflictError("Category name already in use")
        for key, value in data.items():
            setattr(row, key, value)
        self.db.commit()
        self.db.refresh(row)
        return CategoryOut.model_validate(row)

    def delete_category(self, category_id: UUID) -> None:
        row = self.repository.get_category(category_id)
        if row is None:
            raise NotFoundError("Category not found")
        if self.repository.event_count_for_category(category_id) > 0:
            raise ConflictError("Cannot delete a category that still has events")
        self.db.delete(row)
        self.db.commit()

    def list_public(self, *, q: str | None = None, category: str | None = None) -> list[EventOut]:
        events = self.repository.list_events(q=q, category=category, published_only=True)
        return [self._to_out(e) for e in events]

    def list_mine(self, organizer: Profile) -> list[EventOut]:
        events = self.repository.list_events(
            organizer_id=organizer.id, published_only=False
        )
        return [self._to_out(e) for e in events]

    def get(self, event_id: UUID, viewer: Profile | None = None) -> EventOut:
        event = self.repository.get(event_id)
        if event is None:
            raise NotFoundError("Event not found")
        if event.status == "Draft":
            if viewer is None or (
                viewer.role != "admin" and viewer.id != event.organizer_id
            ):
                raise NotFoundError("Event not found")
        return self._to_out(event)

    def create(self, organizer: Profile, payload: EventCreate) -> EventOut:
        category = self.repository.get_or_create_category(payload.category)
        event = Event(
            organizer_id=organizer.id,
            category_id=category.id,
            title=payload.title,
            description=payload.description,
            venue=payload.venue,
            event_date=payload.event_date,
            price=payload.price,
            status=payload.status,
            booking_window_open=payload.booking_window_open,
        )
        self.repository.create(event)
        seats: list[Seat] = []
        for i in range(1, payload.vip_seats + 1):
            seats.append(
                Seat(
                    event_id=event.id,
                    seat_number=f"V-{i}",
                    category="VIP",
                    status="Available",
                )
            )
        for i in range(1, payload.standard_seats + 1):
            seats.append(
                Seat(
                    event_id=event.id,
                    seat_number=f"S-{i}",
                    category="Standard",
                    status="Available",
                )
            )
        self.db.add_all(seats)
        self.db.commit()
        return self.get(event.id, organizer)

    def update(
        self, organizer: Profile, event_id: UUID, payload: EventUpdate
    ) -> EventOut:
        event = self.repository.get(event_id)
        if event is None:
            raise NotFoundError("Event not found")
        if event.organizer_id != organizer.id and organizer.role != "admin":
            raise ForbiddenError("Not allowed to update this event")
        data = payload.model_dump(exclude_unset=True)
        if "category" in data:
            cat_name = data.pop("category")
            if cat_name:
                event.category_id = self.repository.get_or_create_category(cat_name).id
        for key, value in data.items():
            setattr(event, key, value)
        material = any(
            k in data or (k == "category" and "category" in payload.model_dump(exclude_unset=True))
            for k in ("title", "venue", "event_date", "status")
        )
        self.db.commit()
        if material and event.status == "Published":
            self._notify_attendees(event, "event_updated", "Event updated", f"{event.title} details were updated.")
            self.db.commit()
        return self.get(event_id, organizer)

    def delete(self, organizer: Profile, event_id: UUID) -> None:
        event = self.repository.get(event_id)
        if event is None:
            raise NotFoundError("Event not found")
        if event.organizer_id != organizer.id and organizer.role != "admin":
            raise ForbiddenError("Not allowed to delete this event")
        self.repository.delete(event)
        self.db.commit()

    def _notify_attendees(self, event: Event, ntype: str, title: str, message: str) -> None:
        from sqlalchemy import select

        from app.bookings.models import Booking
        from app.notifications.service import notify

        bookings = list(
            self.db.scalars(
                select(Booking).where(
                    Booking.event_id == event.id,
                    Booking.status.in_(("Confirmed", "Pending")),
                )
            ).all()
        )
        seen: set = set()
        for booking in bookings:
            if booking.user_id in seen:
                continue
            seen.add(booking.user_id)
            notify(
                self.db,
                user_id=booking.user_id,
                ntype=ntype,
                title=title,
                message=message,
                event_id=event.id,
                booking_id=booking.id,
            )

    def _to_out(self, event: Event) -> EventOut:
        total = len(event.seats) if event.seats is not None else 0
        sold = sum(1 for s in (event.seats or []) if s.status == "Booked")
        if total == 0:
            total, sold = self.repository.seat_counts(event.id)
        vip_price = event.price * 2 if event.price else event.price
        cat_name = event.category.name if event.category else "General"
        return EventOut(
            id=event.id,
            title=event.title,
            description=event.description,
            category=cat_name,
            venue=event.venue,
            city="Dhaka",
            event_date=event.event_date,
            price=event.price,
            price_from=event.price,
            price_to=vip_price,
            status=event.status,
            booking_window_open=event.booking_window_open,
            organizer_id=event.organizer_id,
            total_seats=total,
            sold_seats=sold,
            image=DEFAULT_IMAGE,
            tags=[cat_name],
        )
