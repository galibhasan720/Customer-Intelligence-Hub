"""Events controller."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.events.schemas import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    EventCreate,
    EventOut,
    EventUpdate,
)
from app.events.service import EventsService
from app.users.models import Profile


def list_events(
    db: Session, *, q: str | None = None, category: str | None = None
) -> list[EventOut]:
    return EventsService(db).list_public(q=q, category=category)


def list_mine(db: Session, organizer: Profile) -> list[EventOut]:
    return EventsService(db).list_mine(organizer)


def get_event(db: Session, event_id: UUID, viewer: Profile | None = None) -> EventOut:
    return EventsService(db).get(event_id, viewer)


def create_event(db: Session, organizer: Profile, payload: EventCreate) -> EventOut:
    return EventsService(db).create(organizer, payload)


def update_event(
    db: Session, organizer: Profile, event_id: UUID, payload: EventUpdate
) -> EventOut:
    return EventsService(db).update(organizer, event_id, payload)


def delete_event(db: Session, organizer: Profile, event_id: UUID) -> None:
    EventsService(db).delete(organizer, event_id)


def list_categories(db: Session) -> list[CategoryOut]:
    return EventsService(db).list_categories()


def create_category(db: Session, payload: CategoryCreate) -> CategoryOut:
    return EventsService(db).create_category(payload)


def update_category(db: Session, category_id: UUID, payload: CategoryUpdate) -> CategoryOut:
    return EventsService(db).update_category(category_id, payload)


def delete_category(db: Session, category_id: UUID) -> None:
    EventsService(db).delete_category(category_id)
