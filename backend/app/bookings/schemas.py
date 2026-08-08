"""Booking schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class BookingCreate(BaseModel):
    event_id: UUID
    seat_ids: list[UUID] = Field(min_length=1)
    guest_name: str | None = None
    guest_email: str | None = None


class BookingUpdate(BaseModel):
    guest_name: str | None = Field(default=None, min_length=1, max_length=255)
    guest_email: str | None = Field(default=None, max_length=255)


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
    guest_name: str | None = None
    guest_email: str | None = None

    model_config = {"from_attributes": True}
