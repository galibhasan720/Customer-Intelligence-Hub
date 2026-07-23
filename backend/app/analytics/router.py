"""HTTP router for the analytics domain.

Analytics stubs (Feature 13).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.analytics import controller

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/ping")
def ping() -> dict[str, str]:
    """Stub endpoint proving Router → Controller → Service → Repository."""
    return controller.ping()
