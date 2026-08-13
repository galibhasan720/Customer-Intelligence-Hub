"""In-memory SQLite TestClient fixtures for RBAC + CRUD smoke tests."""

from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.addons.models  # noqa: F401
import app.bookings.models  # noqa: F401
import app.events.models  # noqa: F401
import app.notifications.models  # noqa: F401
import app.payments.models  # noqa: F401
import app.seats.models  # noqa: F401
import app.venues.models  # noqa: F401
from app.database.session import Base, get_db
from app.main import app as fastapi_app
from app.users.models import Profile
from tests.helpers import seed_user


@compiles(JSONB, "sqlite")
def _compile_jsonb_sqlite(_type, _compiler, **_kw):  # noqa: ANN001
    return "JSON"


@compiles(PGUUID, "sqlite")
def _compile_uuid_sqlite(_type, _compiler, **_kw):  # noqa: ANN001
    return "CHAR(36)"


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = factory()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def _override_db() -> Generator[Session, None, None]:
        yield db_session

    fastapi_app.dependency_overrides[get_db] = _override_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()


@pytest.fixture()
def customer(db_session: Session) -> Profile:
    return seed_user(db_session, email="customer@example.com", role="customer", full_name="Demo Customer")


@pytest.fixture()
def organizer(db_session: Session) -> Profile:
    return seed_user(
        db_session,
        email="organizer@example.com",
        role="organizer",
        full_name="Demo Organizer",
    )


@pytest.fixture()
def organizer_b(db_session: Session) -> Profile:
    return seed_user(
        db_session,
        email="organizer2@example.com",
        role="organizer",
        full_name="Other Organizer",
    )


@pytest.fixture()
def admin(db_session: Session) -> Profile:
    return seed_user(db_session, email="admin@example.com", role="admin", full_name="Demo Admin")
