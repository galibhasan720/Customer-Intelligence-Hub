"""HTTP router for the analytics domain."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.analytics import controller
from app.analytics.schemas import OrganizerAnalyticsOut
from app.core.dependencies import require_organizer
from app.database.session import get_db
from app.users.models import Profile

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/organizer", response_model=OrganizerAnalyticsOut)
def organizer_analytics(
    organizer: Profile = Depends(require_organizer),
    db: Session = Depends(get_db),
) -> OrganizerAnalyticsOut:
    """Live organizer dashboard metrics derived from owned events and bookings."""
    return controller.organizer_dashboard(db, organizer)
