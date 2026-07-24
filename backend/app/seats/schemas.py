"""Seat schemas."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class SeatOut(BaseModel):
    id: UUID
    seat_number: str
    category: str
    status: str
    price: float

    model_config = {"from_attributes": True}
