"""Analytics aggregates."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.analytics.schemas import AnalyticsOverview, RevenueRow, StatusSlice, TrendPoint
from app.bookings.models import Booking
from app.events.models import Event
from app.seats.models import Seat
from app.users.models import Profile


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


class AnalyticsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def overview(self, user: Profile) -> AnalyticsOverview:
        events_stmt = select(Event)
        if user.role != "admin":
            events_stmt = events_stmt.where(Event.organizer_id == user.id)
        events = list(self.db.scalars(events_stmt).all())
        event_ids = [e.id for e in events]

        if user.role != "admin" and not event_ids:
            bookings: list[Booking] = []
            seats: list[Seat] = []
        else:
            bookings_stmt = select(Booking)
            seats_stmt = select(Seat)
            if user.role != "admin":
                bookings_stmt = bookings_stmt.where(Booking.event_id.in_(event_ids))
                seats_stmt = seats_stmt.where(Seat.event_id.in_(event_ids))
            bookings = list(self.db.scalars(bookings_stmt).all())
            seats = list(self.db.scalars(seats_stmt).all())

        total = len(bookings)
        cancelled = sum(1 for b in bookings if b.status == "Cancelled")
        confirmed = sum(1 for b in bookings if b.status == "Confirmed")
        pending = sum(1 for b in bookings if b.status == "Pending")
        sold = sum(1 for s in seats if s.status == "Booked")
        available = sum(1 for s in seats if s.status in ("Available", "Locked"))

        now = datetime.now(timezone.utc)
        upcoming = sum(
            1
            for e in events
            if (event_at := _as_utc(e.event_date)) is not None
            and event_at >= now
            and e.status == "Published"
        )

        revenue = 0.0
        revenue_rows: list[RevenueRow] = []
        colors = ["#16A34A", "#1D4ED8", "#7C3AED", "#D97706", "#DC2626"]
        for i, event in enumerate(events[:5]):
            sold_for_event = sum(1 for s in seats if s.event_id == event.id and s.status == "Booked")
            event_rev = float(event.price or 0) * sold_for_event
            revenue += event_rev
            target = float(event.price or 0) * max(1, sum(1 for s in seats if s.event_id == event.id))
            revenue_rows.append(
                RevenueRow(
                    event=event.title,
                    revenue=event_rev,
                    target=target,
                    color=colors[i % len(colors)],
                )
            )

        trend: list[TrendPoint] = []
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        today = now.date()
        start = today - timedelta(days=today.weekday())
        for i, label in enumerate(labels):
            day = start + timedelta(days=i)
            count = sum(
                1
                for b in bookings
                if (created := _as_utc(b.created_at)) is not None and created.date() == day
            )
            trend.append(TrendPoint(day=label, bookings=count))

        rate = round((cancelled / total) * 100, 1) if total else 0.0
        return AnalyticsOverview(
            total_bookings=total,
            seats_sold=sold,
            seats_available=available,
            cancellation_rate=rate,
            upcoming_events=upcoming,
            estimated_revenue=revenue,
            weekly_trend=trend,
            status_breakdown=[
                StatusSlice(label="Confirmed", value=round((confirmed / total) * 100, 1) if total else 0, color="#16A34A"),
                StatusSlice(label="Pending", value=round((pending / total) * 100, 1) if total else 0, color="#D97706"),
                StatusSlice(label="Cancelled", value=rate, color="#DC2626"),
            ],
            revenue_by_event=revenue_rows,
        )
