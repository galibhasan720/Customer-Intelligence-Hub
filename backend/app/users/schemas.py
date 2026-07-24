"""Users schemas."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class ProfileOut(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str

    model_config = {"from_attributes": True}
