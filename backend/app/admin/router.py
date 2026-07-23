"""HTTP router for the admin domain.

Admin stubs (Feature 14).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.admin import controller

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
def ping() -> dict[str, str]:
    """Stub endpoint proving Router → Controller → Service → Repository."""
    return controller.ping()
