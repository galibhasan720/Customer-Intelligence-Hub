# Seat-Flow Database Schema (Supabase PostgreSQL)

Canonical persistence for the MVP. **Not** DynamoDB.

SQL source of truth: [`../scripts/sql/001_init_schema.sql`](../scripts/sql/001_init_schema.sql)

## Apply

1. Set a real `DATABASE_URL` in `backend/.env` (Supabase → Project Settings → Database → URI).
2. Prefer **Supabase SQL Editor**: paste and run `001_init_schema.sql` (needs `auth.users` for `profiles` FK).
3. Or from `backend/`: `python -m scripts.migrations`
4. Seed: create an Auth user + `profiles` row (`role='organizer'`), then `python -m scripts.seed_data`

## Tables

### `profiles`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | Same as `auth.users.id` |
| `full_name` | VARCHAR(255) | |
| `email` | VARCHAR(255) UNIQUE | |
| `role` | VARCHAR(32) | `customer` \| `organizer` \| `admin` |
| `is_active` | BOOLEAN | default true |
| `created_at` / `updated_at` | timestamptz | |

**Model:** `app.users.models.Profile`

### `categories`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `name` | VARCHAR(100) UNIQUE | |
| `description` | TEXT | nullable |
| `is_active` | BOOLEAN | |

**Model:** `app.events.models.Category`

### `events`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `organizer_id` | UUID FK → profiles | |
| `category_id` | UUID FK → categories | |
| `title`, `description`, `venue` | | |
| `event_date` | timestamptz | |
| `price` | NUMERIC(10,2) | |
| `status` | | `Draft` \| `Published` \| `Cancelled` |
| `booking_window_open` | BOOLEAN | |

**Model:** `app.events.models.Event`

### `seats`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `event_id` | UUID FK → events | ON DELETE CASCADE |
| `seat_number` | VARCHAR(32) | unique per event |
| `category` | | `VIP` \| `Standard` |
| `status` | | `Available` \| `Locked` \| `Booked` |
| `locked_until` | timestamptz | nullable |
| `locked_by_user_id` | UUID FK → profiles | nullable |

**Constraint:** `UNIQUE (event_id, seat_number)`  
**Model:** `app.seats.models.Seat`

### `bookings`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `user_id` | UUID FK → profiles | |
| `event_id` | UUID FK → events | |
| `status` | | `Pending` \| `Confirmed` \| `Cancelled` \| `Expired` |

**Model:** `app.bookings.models.Booking`

### `booking_seats`

Join table for multi-seat bookings.

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `booking_id` | UUID FK → bookings | ON DELETE CASCADE |
| `seat_id` | UUID FK → seats | **UNIQUE** (double-booking prevention) |

**Model:** `app.bookings.models.BookingSeat`

### `notifications`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `user_id` | UUID FK → profiles | |
| `event_id` / `booking_id` | UUID | nullable |
| `type` | | `confirmation` \| `cancellation` \| `reminder` \| `event_update` |
| `message` | TEXT | |
| `status` | | `pending` \| `sent` \| `read` |
| `sent_at` | timestamptz | nullable |

**Model:** `app.notifications.models.Notification`

## Relationships

```
auth.users 1—1 profiles
profiles 1—* events (organizer)
categories 1—* events
events 1—* seats
profiles 1—* bookings
events 1—* bookings
bookings 1—* booking_seats
seats 1—0..1 booking_seats   (UNIQUE seat_id)
profiles 1—* notifications
```

## Double-booking prevention

1. `UNIQUE (event_id, seat_number)` on `seats`
2. `UNIQUE (seat_id)` on `booking_seats`
3. Application transactions update `seats.status` to `Booked` in the same booking write (Feature 8–9)
