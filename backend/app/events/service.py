"""Events service."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotFoundError
from app.events.models import Event
from app.events.repository import EventsRepository
from app.events.schemas import EventCreate, EventOut, EventUpdate
from app.seats.models import Seat
from app.users.models import Profile

DEFAULT_IMAGE = (
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"
)


class EventsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = EventsRepository(db)

    def list_public(self, *, q: str | None = None, category: str | None = None) -> list[EventOut]:
        events = self.repository.list_events(q=q, category=category, published_only=True)
        return [self._to_out(e) for e in events]

    def list_mine(self, organizer: Profile) -> list[EventOut]:
        events = self.repository.list_events(
            organizer_id=organizer.id, published_only=False
        )
        return [self._to_out(e) for e in events]

    def get(self, event_id: UUID) -> EventOut:
        event = self.repository.get(event_id)
        if event is None:
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
        return self.get(event.id)

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
        self.db.commit()
        return self.get(event_id)

    def delete(self, organizer: Profile, event_id: UUID) -> None:
        event = self.repository.get(event_id)
        if event is None:
            raise NotFoundError("Event not found")
        if event.organizer_id != organizer.id and organizer.role != "admin":
            raise ForbiddenError("Not allowed to delete this event")
        self.repository.delete(event)
        self.db.commit()

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
