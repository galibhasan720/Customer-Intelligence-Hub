"""Apply SQL migration files against DATABASE_URL."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from sqlalchemy import text

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.config import get_settings  # noqa: E402
from app.database.client import (  # noqa: E402
    create_db_engine,
    is_placeholder_database_url,
)

SQL_DIR = Path(__file__).resolve().parent / "sql"
MIGRATION_FILES = ("001_init_schema.sql",)


def _split_sql_statements(sql: str) -> list[str]:
    """Split SQL file into statements, dropping comment-only chunks."""
    # Remove full-line SQL comments for simpler splitting.
    lines: list[str] = []
    for line in sql.splitlines():
        stripped = line.strip()
        if stripped.startswith("--"):
            continue
        lines.append(line)
    cleaned = "\n".join(lines)
    parts = re.split(r";\s*\n", cleaned)
    statements: list[str] = []
    for part in parts:
        stmt = part.strip().rstrip(";").strip()
        if stmt:
            statements.append(stmt)
    return statements


def apply_migrations() -> int:
    settings = get_settings()
    if is_placeholder_database_url(settings.database_url):
        print(
            "SKIP: DATABASE_URL is missing or still has placeholders.\n"
            "1. Open Supabase → Project Settings → Database → Connection string (URI).\n"
            "2. Put it in backend/.env as DATABASE_URL=...\n"
            "3. Prefer applying 001_init_schema.sql in Supabase SQL Editor "
            "(required for auth.users FK),\n"
            "   or re-run: python -m scripts.migrations"
        )
        return 1

    assert settings.database_url is not None
    engine = create_db_engine(settings.database_url, connect_timeout=15)

    for name in MIGRATION_FILES:
        path = SQL_DIR / name
        if not path.exists():
            print(f"ERROR: missing migration file {path}")
            return 1
        sql = path.read_text(encoding="utf-8")
        statements = _split_sql_statements(sql)
        print(f"Applying {name} ({len(statements)} statements) ...")
        try:
            with engine.begin() as connection:
                for statement in statements:
                    connection.execute(text(statement))
            print(f"OK: {name}")
        except Exception as exc:  # noqa: BLE001
            print(f"FAILED: {name}")
            print(f"  {exc.__class__.__name__}: {exc}")
            print(
                "\nManual step:\n"
                "1. Open Supabase Dashboard → SQL Editor.\n"
                f"2. Paste contents of scripts/sql/{name}\n"
                "3. Run the script, then re-check GET /health/db"
            )
            return 1

    print("All migrations applied.")
    return 0


if __name__ == "__main__":
    raise SystemExit(apply_migrations())
