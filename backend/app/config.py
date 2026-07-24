"""Application settings loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env when present (local development).
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)


@dataclass(frozen=True)
class Settings:
    app_env: str
    cors_origins: list[str]
    database_url: str | None
    jwt_secret: str
    jwt_algorithm: str
    jwt_expire_minutes: int
    supabase_url: str | None
    supabase_anon_key: str | None
    supabase_service_role_key: str | None
    supabase_jwt_secret: str | None


def _split_origins(raw: str) -> list[str]:
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def is_local_database_url(url: str | None) -> bool:
    if not url:
        return False
    lowered = url.lower()
    return "localhost" in lowered or "127.0.0.1" in lowered


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_env=os.getenv("APP_ENV", "local"),
        cors_origins=_split_origins(
            os.getenv(
                "CORS_ORIGINS",
                "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
            )
        ),
        database_url=os.getenv("DATABASE_URL") or None,
        jwt_secret=os.getenv("JWT_SECRET")
        or os.getenv("SUPABASE_JWT_SECRET")
        or "dev-local-secret-change-me",
        jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        jwt_expire_minutes=int(os.getenv("JWT_EXPIRE_MINUTES", "10080")),
        supabase_url=os.getenv("SUPABASE_URL") or None,
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY") or None,
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY") or None,
        supabase_jwt_secret=os.getenv("SUPABASE_JWT_SECRET") or None,
    )
