"""Analytics schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class TrendPoint(BaseModel):
    day: str
    bookings: int


class StatusSlice(BaseModel):
    label: str
    value: float
    color: str


class RevenueRow(BaseModel):
    event: str
    revenue: float
    target: float
    color: str


class AnalyticsOverview(BaseModel):
    total_bookings: int = 0
    seats_sold: int = 0
    seats_available: int = 0
    cancellation_rate: float = 0
    upcoming_events: int = 0
    estimated_revenue: float = 0
    weekly_trend: list[TrendPoint] = Field(default_factory=list)
    status_breakdown: list[StatusSlice] = Field(default_factory=list)
    revenue_by_event: list[RevenueRow] = Field(default_factory=list)
