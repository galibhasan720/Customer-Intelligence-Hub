"""Notification schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: UUID
    type: str
    title: str
    message: str
    status: str
    read: bool
    created_at: datetime
    event_id: UUID | None = None
    booking_id: UUID | None = None

    model_config = {"from_attributes": True}
