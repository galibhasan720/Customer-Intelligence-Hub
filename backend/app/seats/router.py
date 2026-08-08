"""HTTP router for seats."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.seats import controller
from app.seats.schemas import SeatHoldRequest, SeatOut, SeatReleaseRequest
from app.users.models import Profile

router = APIRouter(tags=["seats"])


@router.get("/events/{event_id}/seats", response_model=list[SeatOut])
def list_event_seats(event_id: UUID, db: Session = Depends(get_db)) -> list[SeatOut]:
    return controller.list_seats(db, event_id)


@router.post("/events/{event_id}/seats/hold", response_model=list[SeatOut])
def hold_seats(
    event_id: UUID,
    payload: SeatHoldRequest,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SeatOut]:
    return controller.hold_seats(db, user, event_id, payload)


@router.post("/events/{event_id}/seats/release", response_model=list[SeatOut])
def release_seats(
    event_id: UUID,
    payload: SeatReleaseRequest,
    user: Profile = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SeatOut]:
    return controller.release_seats(db, user, event_id, payload)
