"""Seats repository."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.seats.models import Seat


class SeatsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_event(self, event_id: UUID) -> list[Seat]:
        stmt = (
            select(Seat)
            .where(Seat.event_id == event_id)
            .order_by(Seat.seat_number.asc())
        )
        return list(self.db.scalars(stmt).all())

    def get_many(self, seat_ids: list[UUID]) -> list[Seat]:
        if not seat_ids:
            return []
        stmt = select(Seat).where(Seat.id.in_(seat_ids)).with_for_update()
        return list(self.db.scalars(stmt).all())
