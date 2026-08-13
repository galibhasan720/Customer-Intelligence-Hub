"""Seats controller."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.seats.schemas import SeatHoldRequest, SeatOut, SeatReleaseRequest
from app.seats.service import SeatsService
from app.users.models import Profile


def list_seats(db: Session, event_id: UUID) -> list[SeatOut]:
    return SeatsService(db).list_for_event(event_id)


def hold_seats(
    db: Session, user: Profile, event_id: UUID, payload: SeatHoldRequest
) -> list[SeatOut]:
    return SeatsService(db).hold(user, event_id, payload)


def release_seats(
    db: Session, user: Profile, event_id: UUID, payload: SeatReleaseRequest
) -> list[SeatOut]:
    return SeatsService(db).release(user, event_id, payload)
