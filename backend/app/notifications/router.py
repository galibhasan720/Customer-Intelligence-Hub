"""HTTP router for the notifications domain.

Notification stubs (Feature 12).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.notifications import controller
from app.users.models import Profile

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/ping")
def ping(_: Profile = Depends(get_current_user)) -> dict[str, str]:
    """Stub endpoint proving Router → Controller → Service → Repository."""
    return controller.ping()
