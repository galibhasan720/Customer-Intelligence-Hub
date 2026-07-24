"""Seats controller."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.seats.schemas import SeatOut
from app.seats.service import SeatsService


def list_seats(db: Session, event_id: UUID) -> list[SeatOut]:
    return SeatsService(db).list_for_event(event_id)
