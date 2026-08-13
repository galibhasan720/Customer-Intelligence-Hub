"""Users schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class ProfileOut(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str
    is_active: bool = True
    organization_name: str | None = None
    bio: str | None = None
    phone: str | None = None
    website: str | None = None
    city: str | None = None
    address: str | None = None
    verified: bool = False
    events_created: int = 0
    total_bookings: int = 0
    member_since: datetime | None = None

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    organization_name: str | None = Field(default=None, max_length=255)
    bio: str | None = None
    phone: str | None = Field(default=None, max_length=64)
    website: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    address: str | None = Field(default=None, max_length=255)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class AdminUserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    role: str | None = Field(default=None, pattern="^(customer|organizer|admin)$")
    is_active: bool | None = None
    verified: bool | None = None
    organization_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = None
