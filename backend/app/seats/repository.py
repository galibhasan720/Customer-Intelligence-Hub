"""Seats repository."""

from __future__ import annotations

from datetime import datetime, timezone
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

    def release_expired_locks(self, event_id: UUID | None = None) -> int:
        now = datetime.now(timezone.utc)
        stmt = select(Seat).where(Seat.status == "Locked", Seat.locked_until.is_not(None), Seat.locked_until < now)
        if event_id is not None:
            stmt = stmt.where(Seat.event_id == event_id)
        rows = list(self.db.scalars(stmt).all())
        for seat in rows:
            seat.status = "Available"
            seat.locked_until = None
            seat.locked_by_user_id = None
        return len(rows)
