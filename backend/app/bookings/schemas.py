"""Booking schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class BookingCreate(BaseModel):
    event_id: UUID
    seat_ids: list[UUID] = Field(min_length=1)


class BookingOut(BaseModel):
    id: UUID
    event_id: UUID
    event_title: str
    venue: str
    event_date: datetime
    seats: list[str]
    seat_ids: list[UUID]
    total: float
    status: str
    booked_at: datetime

    model_config = {"from_attributes": True}
