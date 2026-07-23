"""SQLAlchemy engine, session factory, and declarative Base."""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings
from app.database.client import create_db_engine, is_placeholder_database_url

settings = get_settings()

engine = None
SessionLocal: sessionmaker[Session] | None = None

if settings.database_url and not is_placeholder_database_url(settings.database_url):
    engine = create_db_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    if SessionLocal is None:
        raise RuntimeError(
            "Database is not configured. Set a real DATABASE_URL in backend/.env."
        )
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
