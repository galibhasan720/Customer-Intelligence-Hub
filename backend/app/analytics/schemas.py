"""Pydantic schemas for the analytics domain."""

from __future__ import annotations

from pydantic import BaseModel


class TrendPoint(BaseModel):
    day: str
    bookings: int


class StatusSlice(BaseModel):
    label: str
    value: float
    color: str


class RevenueByEvent(BaseModel):
    event: str
    revenue: float
    target: float
    color: str


class CategorySlice(BaseModel):
    name: str
    value: float
    fill: str


class OccupancyItem(BaseModel):
    event_id: str
    title: str
    sold_seats: int
    total_seats: int
    occupancy_pct: float


class OrganizerAnalyticsOut(BaseModel):
    total_bookings: int
    seats_sold: int
    seats_total: int
    estimated_revenue: float
    cancellation_rate: float
    active_events: int
    avg_ticket_price: float
    weekly_trend: list[TrendPoint]
    status_distribution: list[StatusSlice]
    revenue_by_event: list[RevenueByEvent]
    category_breakdown: list[CategorySlice]
    top_by_occupancy: list[OccupancyItem]
    seat_availability: list[OccupancyItem]
