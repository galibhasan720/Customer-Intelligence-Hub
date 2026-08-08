"""Payment schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class PaymentCreate(BaseModel):
    booking_id: UUID | None = None
    hall_booking_id: UUID | None = None
    method: str = Field(default="card", pattern="^(card|paypal|apple)$")

    @model_validator(mode="after")
    def one_target(self) -> PaymentCreate:
        if bool(self.booking_id) == bool(self.hall_booking_id):
            raise ValueError("Provide exactly one of booking_id or hall_booking_id")
        return self


class PaymentOut(BaseModel):
    id: UUID
    user_id: UUID
    booking_id: UUID | None = None
    hall_booking_id: UUID | None = None
    method: str
    amount: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
