"""HTTP router for seats."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.seats import controller
from app.seats.schemas import SeatOut

router = APIRouter(tags=["seats"])


@router.get("/events/{event_id}/seats", response_model=list[SeatOut])
def list_event_seats(event_id: UUID, db: Session = Depends(get_db)) -> list[SeatOut]:
    return controller.list_seats(db, event_id)
