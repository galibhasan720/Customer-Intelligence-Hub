"""Event API schemas (FE-friendly)."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    venue: str = Field(min_length=1, max_length=255)
    event_date: datetime
    price: Decimal = Field(default=Decimal("0"), ge=0)
    category: str = Field(min_length=1, max_length=100)
    status: str = Field(default="Published", pattern="^(Draft|Published|Cancelled)$")
    booking_window_open: bool = True
    vip_seats: int = Field(default=8, ge=0, le=200)
    standard_seats: int = Field(default=16, ge=0, le=500)


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    venue: str | None = Field(default=None, min_length=1, max_length=255)
    event_date: datetime | None = None
    price: Decimal | None = Field(default=None, ge=0)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    status: str | None = Field(default=None, pattern="^(Draft|Published|Cancelled)$")
    booking_window_open: bool | None = None


class EventOut(BaseModel):
    id: UUID
    title: str
    description: str | None
    category: str
    venue: str
    city: str = "Dhaka"
    event_date: datetime
    price: Decimal
    price_from: Decimal
    price_to: Decimal
    status: str
    booking_window_open: bool
    organizer_id: UUID
    total_seats: int
    sold_seats: int
    image: str = ""
    tags: list[str] = []

    model_config = {"from_attributes": True}
