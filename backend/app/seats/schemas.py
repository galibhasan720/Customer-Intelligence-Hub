"""Seat schemas."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class SeatOut(BaseModel):
    id: UUID
    seat_number: str
    category: str
    status: str
    price: float

    model_config = {"from_attributes": True}


class SeatHoldRequest(BaseModel):
    seat_ids: list[UUID] = Field(min_length=1, max_length=6)


class SeatReleaseRequest(BaseModel):
    seat_ids: list[UUID] = Field(min_length=1, max_length=6)
