"""Database URL helpers and connectivity probes for Supabase PostgreSQL."""

from __future__ import annotations

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError


def sqlalchemy_database_url(url: str) -> str:
    """Prefer psycopg (v3) driver; plain postgresql:// defaults to psycopg2."""
    if url.startswith("postgresql+psycopg://") or url.startswith("postgresql+psycopg2://"):
        return url
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    return url


def is_placeholder_database_url(url: str | None) -> bool:
    if not url:
        return True
    return "YOUR_PROJECT" in url or "YOUR_PASSWORD" in url


def create_db_engine(database_url: str, *, connect_timeout: int = 5) -> Engine:
    return create_engine(
        sqlalchemy_database_url(database_url),
        pool_pre_ping=True,
        connect_args={"connect_timeout": connect_timeout},
    )


def probe_database(database_url: str | None) -> dict[str, str]:
    """Soft-fail connectivity check used by GET /health/db."""
    if not database_url:
        return {"status": "skipped", "detail": "DATABASE_URL is not set"}

    if is_placeholder_database_url(database_url):
        return {
            "status": "skipped",
            "detail": "DATABASE_URL still has placeholder values",
        }

    try:
        engine = create_db_engine(database_url)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "detail": "database reachable"}
    except SQLAlchemyError as exc:
        return {"status": "error", "detail": str(exc.__class__.__name__)}
    except Exception as exc:  # noqa: BLE001 — surface unexpected connect errors
        return {"status": "error", "detail": str(exc)}
