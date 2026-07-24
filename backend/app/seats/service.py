"""Seats service."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.events.repository import EventsRepository
from app.seats.repository import SeatsRepository
from app.seats.schemas import SeatOut


class SeatsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = SeatsRepository(db)
        self.events = EventsRepository(db)

    def list_for_event(self, event_id: UUID) -> list[SeatOut]:
        event = self.events.get(event_id)
        if event is None:
            raise NotFoundError("Event not found")
        base = float(event.price)
        seats = self.repository.list_for_event(event_id)
        out: list[SeatOut] = []
        for seat in seats:
            price = base * 2 if seat.category == "VIP" else base
            out.append(
                SeatOut(
                    id=seat.id,
                    seat_number=seat.seat_number,
                    category=seat.category,
                    status=seat.status,
                    price=price,
                )
            )
        return out
