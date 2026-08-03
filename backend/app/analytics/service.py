"""Service layer for the analytics domain."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.analytics.repository import AnalyticsRepository
from app.analytics.schemas import (
    CategorySlice,
    OccupancyItem,
    OrganizerAnalyticsOut,
    RevenueByEvent,
    StatusSlice,
    TrendPoint,
)
from app.users.models import Profile

CATEGORY_COLORS = {
    "Concert": "#1D4ED8",
    "Sports": "#16A34A",
    "Conference": "#D97706",
    "Theatre": "#7C3AED",
}
EVENT_COLORS = ["#16A34A", "#1D4ED8", "#7C3AED", "#D97706", "#DC2626", "#0EA5E9"]
STATUS_COLORS = {
    "Confirmed": "#16A34A",
    "Pending": "#D97706",
    "Cancelled": "#DC2626",
    "Expired": "#64748B",
}


class AnalyticsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = AnalyticsRepository(db)

    def organizer_dashboard(self, organizer: Profile) -> OrganizerAnalyticsOut:
        events = self.repository.list_organizer_events(organizer.id)
        bookings = self.repository.list_organizer_bookings(organizer.id)

        seats_total = 0
        seats_sold = 0
        occupancy: list[OccupancyItem] = []
        for event in events:
            total = len(event.seats or [])
            sold = sum(1 for s in (event.seats or []) if s.status == "Booked")
            seats_total += total
            seats_sold += sold
            pct = round((sold / total) * 100, 1) if total else 0.0
            occupancy.append(
                OccupancyItem(
                    event_id=str(event.id),
                    title=event.title,
                    sold_seats=sold,
                    total_seats=total,
                    occupancy_pct=pct,
                )
            )

        estimated_revenue = 0.0
        revenue_map: dict[str, float] = defaultdict(float)
        status_counts: dict[str, int] = defaultdict(int)
        category_counts: dict[str, int] = defaultdict(int)

        for booking in bookings:
            status_counts[booking.status] += 1
            event = booking.event
            if event is None:
                continue
            cat = event.category.name if event.category else "General"
            category_counts[cat] += 1
            if booking.status == "Cancelled":
                continue
            base = float(event.price or 0)
            booking_total = 0.0
            for link in booking.booking_seats:
                if link.seat is None:
                    continue
                booking_total += base * 2 if link.seat.category == "VIP" else base
            # Pending bookings without seats still counted in status, not revenue
            estimated_revenue += booking_total
            revenue_map[event.title] += booking_total

        total_bookings = len(bookings)
        cancelled = status_counts.get("Cancelled", 0)
        cancellation_rate = (
            round((cancelled / total_bookings) * 100, 1) if total_bookings else 0.0
        )
        avg_ticket = (
            round(estimated_revenue / seats_sold, 0) if seats_sold else 0.0
        )

        # Last 7 days trend (Mon-Sun style labels by date)
        now = datetime.now(timezone.utc)
        day_counts: dict[str, int] = {}
        labels: list[str] = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).date()
            key = day.isoformat()
            labels.append(day.strftime("%a"))
            day_counts[key] = 0
        for booking in bookings:
            created = booking.created_at
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            key = created.astimezone(timezone.utc).date().isoformat()
            if key in day_counts:
                day_counts[key] += 1
        weekly_trend = [
            TrendPoint(day=labels[i], bookings=day_counts[key])
            for i, key in enumerate(day_counts.keys())
        ]

        status_distribution: list[StatusSlice] = []
        if total_bookings:
            for label in ("Confirmed", "Pending", "Cancelled"):
                count = status_counts.get(label, 0)
                if count == 0 and label == "Pending":
                    continue
                status_distribution.append(
                    StatusSlice(
                        label=label,
                        value=round((count / total_bookings) * 100, 1),
                        color=STATUS_COLORS.get(label, "#64748B"),
                    )
                )
        else:
            status_distribution = [
                StatusSlice(label="Confirmed", value=0, color=STATUS_COLORS["Confirmed"]),
                StatusSlice(label="Pending", value=0, color=STATUS_COLORS["Pending"]),
                StatusSlice(label="Cancelled", value=0, color=STATUS_COLORS["Cancelled"]),
            ]

        revenue_by_event: list[RevenueByEvent] = []
        for idx, event in enumerate(events):
            rev = round(revenue_map.get(event.title, 0.0), 0)
            capacity = len(event.seats or [])
            base = float(event.price or 0)
            # Target = ~80% of capacity at standard price
            target = round(capacity * base * 0.8, 0) if capacity else max(rev, 1)
            revenue_by_event.append(
                RevenueByEvent(
                    event=event.title,
                    revenue=rev,
                    target=max(target, 1),
                    color=EVENT_COLORS[idx % len(EVENT_COLORS)],
                )
            )

        cat_total = sum(category_counts.values()) or 1
        category_breakdown = [
            CategorySlice(
                name=name,
                value=round((count / cat_total) * 100, 1),
                fill=CATEGORY_COLORS.get(name, "#64748B"),
            )
            for name, count in sorted(
                category_counts.items(), key=lambda x: x[1], reverse=True
            )
        ]
        if not category_breakdown:
            # Fall back to event categories with 0 bookings
            seen: set[str] = set()
            for event in events:
                name = event.category.name if event.category else "General"
                if name in seen:
                    continue
                seen.add(name)
                category_breakdown.append(
                    CategorySlice(
                        name=name,
                        value=0,
                        fill=CATEGORY_COLORS.get(name, "#64748B"),
                    )
                )

        top = sorted(occupancy, key=lambda o: o.occupancy_pct, reverse=True)[:4]

        return OrganizerAnalyticsOut(
            total_bookings=total_bookings,
            seats_sold=seats_sold,
            seats_total=seats_total,
            estimated_revenue=round(estimated_revenue, 0),
            cancellation_rate=cancellation_rate,
            active_events=len(events),
            avg_ticket_price=avg_ticket,
            weekly_trend=weekly_trend,
            status_distribution=status_distribution,
            revenue_by_event=revenue_by_event,
            category_breakdown=category_breakdown,
            top_by_occupancy=top,
            seat_availability=occupancy[:6],
        )
