"""HTTP router for the auth domain.

Authentication stubs (Feature 2).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.auth import controller

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/ping")
def ping() -> dict[str, str]:
    """Stub endpoint proving Router → Controller → Service → Repository."""
    return controller.ping()
