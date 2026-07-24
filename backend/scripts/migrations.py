"""Apply SQL migration files against DATABASE_URL."""

from __future__ import annotations

import re
import sys
from pathlib import Path

from sqlalchemy import text

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.config import get_settings, is_local_database_url  # noqa: E402
from app.database.client import (  # noqa: E402
    create_db_engine,
    is_placeholder_database_url,
)

SQL_DIR = Path(__file__).resolve().parent / "sql"


def _migration_files(database_url: str | None) -> tuple[str, ...]:
    if is_local_database_url(database_url):
        return ("002_local_init_schema.sql", "003_venues_schema.sql")
    return ("001_init_schema.sql", "003_venues_schema.sql")



def _split_sql_statements(sql: str) -> list[str]:
    """Split SQL file into statements, dropping comment-only chunks."""
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
            "For local: docker compose up -d postgres and use "
            "postgresql://seatflow:seatflow@localhost:5432/seatflow"
        )
        return 1

    assert settings.database_url is not None
    engine = create_db_engine(settings.database_url, connect_timeout=15)
    files = _migration_files(settings.database_url)

    for name in files:
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
            return 1

    print("All migrations applied.")
    return 0


if __name__ == "__main__":
    raise SystemExit(apply_migrations())
