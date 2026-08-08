# API endpoints (`/api/v1`)

All JSON. Auth = `Authorization: Bearer <JWT>` unless noted public.

## Auth
| Method | Path | Auth |
|---|---|---|
| POST | `/auth/register` | public |
| POST | `/auth/login` | public |
| POST | `/auth/logout` | public (204) |

## Users
| Method | Path | Auth |
|---|---|---|
| GET | `/users/me` | any user |
| PATCH | `/users/me` | any user |
| POST | `/users/me/password` | any user |

## Events & categories
| Method | Path | Auth |
|---|---|---|
| GET | `/events` | public (Published only) |
| GET | `/events/mine` | organizer / admin |
| GET | `/events/{id}` | public (drafts: owner/admin) |
| POST | `/events` | organizer / admin |
| PATCH / DELETE | `/events/{id}` | owner or admin |
| GET | `/categories` | public |

## Seats
| Method | Path | Auth |
|---|---|---|
| GET | `/events/{id}/seats` | public |
| POST | `/events/{id}/seats/hold` | logged-in (max 6, ~10 min) |
| POST | `/events/{id}/seats/release` | holder or admin |

## Event bookings
| Method | Path | Auth |
|---|---|---|
| GET | `/bookings/me` | own |
| GET | `/bookings/{id}` | owner or admin |
| POST | `/bookings` | logged-in (optional `guest_name` / `guest_email`) |
| PATCH | `/bookings/{id}` | owner or admin (guest fields only) |
| POST | `/bookings/{id}/cancel` | owner or admin |

## Venues & halls
| Method | Path | Auth |
|---|---|---|
| GET | `/venues`, `/venues/{id}`, `/venues/{id}/halls`, `/halls/{id}` | public |
| POST / PATCH / DELETE | `/venues`, `/venues/{id}` | organizer / admin |
| POST | `/venues/{id}/halls` | organizer / admin |
| PATCH / DELETE | `/halls/{id}` | organizer / admin |
| GET | `/hall-bookings/me` | own |
| POST | `/hall-bookings` | logged-in (totals from add-on catalog) |
| PATCH | `/hall-bookings/{id}` | owner or admin |
| POST | `/hall-bookings/{id}/cancel` | owner or admin |

## Add-ons, payments, notifications, analytics
| Method | Path | Auth |
|---|---|---|
| GET | `/add-ons` | public (`is_active`) |
| POST | `/payments` | logged-in (`booking_id` **or** `hall_booking_id` + `method`) |
| GET | `/payments/me`, `/payments/{id}` | own (admin: any) |
| POST | `/payments/{id}/refund` | admin |
| GET | `/notifications?unread_only=` | own |
| PATCH | `/notifications/{id}/read` | own |
| POST | `/notifications/read-all` | own |
| DELETE | `/notifications` | own |
| GET | `/analytics/overview` | organizer (own events) or admin (platform) |

## Admin
All require `role=admin`.

| Method | Path |
|---|---|
| GET / GET / PATCH / DELETE | `/admin/users`, `/admin/users/{id}` (DELETE = soft deactivate) |
| GET / POST / PATCH / DELETE | `/admin/categories`, `/admin/categories/{id}` |
| GET / POST / PATCH / DELETE | `/admin/add-ons`, `/admin/add-ons/{id}` |
| GET | `/admin/bookings` |
| POST | `/admin/bookings/{id}/cancel` (force-cancel) |
| POST | `/admin/notifications/reminders` (one-shot, next 48h) |

There is no background worker. Reminders can also be documented as a one-shot script; the admin endpoint above is the in-API trigger.

Health (no `/api/v1` prefix): `GET /health`, `GET /health/db`.
