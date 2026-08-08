# Authentication & RBAC

Seat-Flow uses **local JWT + bcrypt**. The API does not use Supabase Auth.

## Tokens

- Register: `POST /api/v1/auth/register` (`role` may be `customer` or `organizer` only — never `admin`)
- Login: `POST /api/v1/auth/login` → `{ access_token, token_type, user }`
- Send `Authorization: Bearer <access_token>` on protected routes
- Logout is client-side (discard the token); `POST /api/v1/auth/logout` is a 204 no-op

Seed accounts (password `password123`):

| Email | Role |
|---|---|
| `customer@example.com` | customer |
| `organizer@example.com` | organizer |
| `admin@example.com` | admin |

## Roles

| Area | Guest | Customer | Organizer | Admin |
|---|---|---|---|---|
| Events / venues / halls / seats / add-ons GET | yes | yes | yes | yes |
| Event write | no | no | own | all |
| Venue / hall write | no | no | yes | yes |
| Booking / hall-booking create | no | yes | yes | yes |
| Booking / hall-booking read / update / cancel | no | own | own | all + force-cancel |
| Profile GET / PATCH `/users/me` | no | own | own | own |
| Users list / role / deactivate | no | no | no | yes |
| Categories write | no | no | no | yes |
| Notifications | no | own | own | own + reminders |
| Analytics | no | no | own events | platform |
| Payments | no | own | own | all + refund |

Draft events are hidden from public `GET /events` and `GET /events/{id}` unless the caller is the owner or an admin.

`verified` on a profile can only be set by admin (`PATCH /api/v1/admin/users/{id}`).
