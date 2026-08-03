"""Pydantic schemas for the admin domain."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AdminUserOut(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserUpdate(BaseModel):
    role: str | None = Field(default=None, pattern="^(customer|organizer|admin)$")
    is_active: bool | None = None


class CategoryOut(BaseModel):
    id: UUID
    name: str
    description: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    is_active: bool | None = None


class AdminBookingOut(BaseModel):
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
    user_id: UUID
    user_email: str
    user_name: str

    model_config = {"from_attributes": True}
