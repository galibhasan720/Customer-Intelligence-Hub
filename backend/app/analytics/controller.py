"""Controller layer for the analytics domain.

Analytics stubs (Feature 13).
"""

from __future__ import annotations

from app.analytics.service import AnalyticsService

_service = AnalyticsService()


def ping() -> dict[str, str]:
    """Health-style stub used to verify MVC wiring."""
    payload = _service.ping()
    payload["layer"] = "controller"
    return payload
