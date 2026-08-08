"""Seat-Flow FastAPI entrypoint — health checks, CORS, and domain routers."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import models so SQLAlchemy mappers resolve relationship string names.
import app.addons.models  # noqa: F401
import app.bookings.models  # noqa: F401
import app.events.models  # noqa: F401
import app.notifications.models  # noqa: F401
import app.payments.models  # noqa: F401
import app.seats.models  # noqa: F401
import app.users.models  # noqa: F401
import app.venues.models  # noqa: F401
from app.addons.router import router as addons_router
from app.admin.router import router as admin_router
from app.analytics.router import router as analytics_router
from app.auth.router import router as auth_router
from app.bookings.router import router as bookings_router
from app.config import get_settings
from app.database.client import probe_database
from app.events.router import categories_router, router as events_router
from app.middleware.error_handler import register_exception_handlers
from app.notifications.router import router as notifications_router
from app.payments.router import router as payments_router
from app.seats.router import router as seats_router
from app.users.router import router as users_router
from app.venues.router import router as venues_router

settings = get_settings()

app = FastAPI(
    title="Seat-Flow API",
    description="Event seat booking API (FastAPI + Supabase PostgreSQL)",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

API_V1_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_V1_PREFIX)
app.include_router(users_router, prefix=API_V1_PREFIX)
app.include_router(events_router, prefix=API_V1_PREFIX)
app.include_router(categories_router, prefix=API_V1_PREFIX)
app.include_router(seats_router, prefix=API_V1_PREFIX)
app.include_router(bookings_router, prefix=API_V1_PREFIX)
app.include_router(venues_router, prefix=API_V1_PREFIX)
app.include_router(addons_router, prefix=API_V1_PREFIX)
app.include_router(payments_router, prefix=API_V1_PREFIX)
app.include_router(notifications_router, prefix=API_V1_PREFIX)
app.include_router(analytics_router, prefix=API_V1_PREFIX)
app.include_router(admin_router, prefix=API_V1_PREFIX)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "env": settings.app_env}


@app.get("/health/db")
def health_db() -> dict[str, str]:
    """Probe Supabase PostgreSQL connectivity. Soft-fails if DATABASE_URL is unset."""
    return probe_database(settings.database_url)
