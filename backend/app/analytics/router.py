"""HTTP router for analytics."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.analytics import controller
from app.analytics.schemas import AnalyticsOverview
from app.core.dependencies import require_organizer
from app.database.session import get_db
from app.users.models import Profile

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def overview(
    user: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> AnalyticsOverview:
    return controller.overview(db, user)
