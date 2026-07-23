"""Initialize database helpers (delegates to migrations)."""

from __future__ import annotations

from scripts.migrations import apply_migrations


def main() -> int:
    return apply_migrations()


if __name__ == "__main__":
    raise SystemExit(main())
