# Phase A — Manual Supabase steps (required to finish Feature 1)

Code for Features 0–1 is ready. Your `backend/.env` still has **placeholder** values, so `/health/db` returns `skipped` and migrations cannot run yet.

## Step 1 — Confirm Supabase project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your Seat-Flow project (or create one)

## Step 2 — Fill `backend/.env`

Copy from `backend/.env.example` if needed, then replace placeholders:


| Variable                    | Where to find it                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `DATABASE_URL`              | Project Settings → **Database** → Connection string → **URI** (use the DB password you set) |
| `SUPABASE_URL`              | Project Settings → **API** → Project URL                                                    |
| `SUPABASE_ANON_KEY`         | Project Settings → **API** → `anon` `public`                                                |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → **API** → `service_role` (secret)                                        |
| `SUPABASE_JWT_SECRET`       | Project Settings → **API** → JWT Secret                                                     |


Do **not** commit `.env`.

After saving, `YOUR_PROJECT` / `YOUR_PASSWORD` / `your-anon-key` must be gone from the file.

## Step 3 — Apply schema (SQL Editor recommended)

1. Supabase → **SQL Editor** → New query
2. Paste the full contents of `[backend/scripts/sql/001_init_schema.sql](../scripts/sql/001_init_schema.sql)`
3. Run it (needs `auth.users` for the `profiles` FK)

Optional alternative from `backend/`:

```powershell
cd backend
.\.venv\Scripts\python.exe -m scripts.migrations
```



## Step 4 — Create organizer for seed data

1. Authentication → Users → **Add user** (email + password)
2. Copy the user **UUID**
3. SQL Editor:

```sql
INSERT INTO profiles (id, full_name, email, role)
VALUES ('PASTE-USER-UUID-HERE', 'Demo Organizer', 'organizer@example.com', 'organizer');
```

1. Optional in `.env`: `SEED_ORGANIZER_ID=PASTE-USER-UUID-HERE`



## Step 5 — Seed + verify

```powershell
cd backend
.\.venv\Scripts\python.exe -m scripts.seed_data
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

Check:

- `GET http://127.0.0.1:8000/health` → `ok`
- `GET http://127.0.0.1:8000/health/db` → `ok`
- `GET http://127.0.0.1:8000/docs` → domain routers listed
- `GET http://127.0.0.1:8000/api/v1/events/ping` → MVC stub



## Step 6 — Reply here

Reply with: **“Supabase .env and schema done”** (and whether seed succeeded).  
Then verification of `/health/db` + tables can be finished in this chat.