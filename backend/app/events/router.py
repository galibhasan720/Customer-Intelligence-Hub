"""HTTP router for events."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_organizer
from app.database.session import get_db
from app.events import controller
from app.events.schemas import EventCreate, EventOut, EventUpdate
from app.users.models import Profile

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def list_events(
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[EventOut]:
    return controller.list_events(db, q=q, category=category)


@router.get("/mine", response_model=list[EventOut])
def list_my_events(
    organizer: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> list[EventOut]:
    return controller.list_mine(db, organizer)


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: UUID, db: Session = Depends(get_db)) -> EventOut:
    return controller.get_event(db, event_id)


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    organizer: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> EventOut:
    return controller.create_event(db, organizer, payload)


@router.patch("/{event_id}", response_model=EventOut)
def update_event(
    event_id: UUID,
    payload: EventUpdate,
    organizer: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> EventOut:
    return controller.update_event(db, organizer, event_id, payload)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: UUID,
    organizer: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> Response:
    controller.delete_event(db, organizer, event_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
