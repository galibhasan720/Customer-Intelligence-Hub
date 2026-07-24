"""Events controller."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.events.schemas import EventCreate, EventOut, EventUpdate
from app.events.service import EventsService
from app.users.models import Profile


def list_events(
    db: Session, *, q: str | None = None, category: str | None = None
) -> list[EventOut]:
    return EventsService(db).list_public(q=q, category=category)


def list_mine(db: Session, organizer: Profile) -> list[EventOut]:
    return EventsService(db).list_mine(organizer)


def get_event(db: Session, event_id: UUID) -> EventOut:
    return EventsService(db).get(event_id)


def create_event(db: Session, organizer: Profile, payload: EventCreate) -> EventOut:
    return EventsService(db).create(organizer, payload)


def update_event(
    db: Session, organizer: Profile, event_id: UUID, payload: EventUpdate
) -> EventOut:
    return EventsService(db).update(organizer, event_id, payload)


def delete_event(db: Session, organizer: Profile, event_id: UUID) -> None:
    EventsService(db).delete(organizer, event_id)
