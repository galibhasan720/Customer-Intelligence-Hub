"""Controller layer for the analytics domain."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.analytics.schemas import OrganizerAnalyticsOut
from app.analytics.service import AnalyticsService
from app.users.models import Profile


def organizer_dashboard(db: Session, organizer: Profile) -> OrganizerAnalyticsOut:
    return AnalyticsService(db).organizer_dashboard(organizer)
