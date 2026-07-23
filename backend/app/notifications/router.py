"""HTTP router for the notifications domain.

Notification stubs (Feature 12).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.notifications import controller

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/ping")
def ping() -> dict[str, str]:
    """Stub endpoint proving Router → Controller → Service → Repository."""
    return controller.ping()
