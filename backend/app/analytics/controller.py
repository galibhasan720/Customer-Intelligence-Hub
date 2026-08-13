"""Analytics controller."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.analytics.schemas import AnalyticsOverview
from app.analytics.service import AnalyticsService
from app.users.models import Profile


def overview(db: Session, user: Profile) -> AnalyticsOverview:
    return AnalyticsService(db).overview(user)
