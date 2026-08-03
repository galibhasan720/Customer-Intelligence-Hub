"""Canonical application roles for SeatFlow RBAC."""

from __future__ import annotations

from typing import Final


class UserRole:
    CUSTOMER: Final[str] = "customer"
    ORGANIZER: Final[str] = "organizer"
    ADMIN: Final[str] = "admin"

    ALL: Final[tuple[str, ...]] = (CUSTOMER, ORGANIZER, ADMIN)
    REGISTERABLE: Final[tuple[str, ...]] = (CUSTOMER, ORGANIZER)


def is_admin(role: str) -> bool:
    return role == UserRole.ADMIN


def is_organizer_or_admin(role: str) -> bool:
    return role in (UserRole.ORGANIZER, UserRole.ADMIN)
