"""Add-on catalog schemas."""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class AddOnCreate(BaseModel):
    id: str = Field(min_length=1, max_length=64, pattern="^[a-z0-9_\\-]+$")
    label: str = Field(min_length=1, max_length=255)
    price: Decimal = Field(default=Decimal("0"), ge=0)
    unit: str = Field(default="flat", pattern="^(flat|per_person)$")
    is_active: bool = True


class AddOnUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=255)
    price: Decimal | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, pattern="^(flat|per_person)$")
    is_active: bool | None = None


class AddOnOut(BaseModel):
    id: str
    label: str
    price: float
    unit: str
    is_active: bool = True

    model_config = {"from_attributes": True}
