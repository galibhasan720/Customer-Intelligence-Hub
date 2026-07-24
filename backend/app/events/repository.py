"""Events repository."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.events.models import Category, Event
from app.seats.models import Seat


class EventsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_events(
        self,
        *,
        q: str | None = None,
        category: str | None = None,
        organizer_id: UUID | None = None,
        published_only: bool = True,
    ) -> list[Event]:
        stmt = select(Event).options(
            joinedload(Event.category),
            joinedload(Event.seats),
        )
        if published_only:
            stmt = stmt.where(Event.status == "Published")
        if organizer_id is not None:
            stmt = stmt.where(Event.organizer_id == organizer_id)
        if category and category.lower() != "all":
            stmt = stmt.join(Event.category).where(Category.name == category)
        if q:
            like = f"%{q.strip()}%"
            stmt = stmt.where(
                or_(Event.title.ilike(like), Event.venue.ilike(like), Event.description.ilike(like))
            )
        stmt = stmt.order_by(Event.event_date.asc())
        return list(self.db.scalars(stmt).unique().all())

    def get(self, event_id: UUID) -> Event | None:
        stmt = (
            select(Event)
            .where(Event.id == event_id)
            .options(joinedload(Event.category), joinedload(Event.seats))
        )
        return self.db.scalars(stmt).unique().first()

    def get_or_create_category(self, name: str) -> Category:
        row = self.db.scalar(select(Category).where(Category.name == name))
        if row is None:
            row = Category(name=name, description=None, is_active=True)
            self.db.add(row)
            self.db.flush()
        return row

    def create(self, event: Event) -> Event:
        self.db.add(event)
        self.db.flush()
        return event

    def delete(self, event: Event) -> None:
        self.db.delete(event)

    def seat_counts(self, event_id: UUID) -> tuple[int, int]:
        total = self.db.scalar(
            select(func.count()).select_from(Seat).where(Seat.event_id == event_id)
        ) or 0
        sold = self.db.scalar(
            select(func.count())
            .select_from(Seat)
            .where(Seat.event_id == event_id, Seat.status == "Booked")
        ) or 0
        return int(total), int(sold)
