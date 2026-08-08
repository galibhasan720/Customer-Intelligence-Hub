# Seat-Flow Backend

FastAPI API for the Seat-Flow MVP.

**Stack:** FastAPI + Uvicorn → Hugging Face Spaces (Docker) · PostgreSQL (local Docker or Supabase) · **local JWT + bcrypt** (not Supabase Auth)

MVC: router → controller → service → repository. RBAC: `customer` | `organizer` | `admin` — see [docs/authentication.md](docs/authentication.md) and [docs/api_endpoints.md](docs/api_endpoints.md).

## Prerequisites

| Tool | Version | Check |
|------|---------|--------|
| Python | 3.11+ | `python --version` |
| Git | any recent | `git --version` |
| Docker Desktop | optional locally; required for HF image smoke | `docker --version` |

For local Postgres: `docker compose up -d postgres` (see `.env.example`). A hosted **Supabase** project still works as the database only — auth stays local JWT.

## Local setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
# Set DATABASE_URL + JWT_SECRET (local Docker Postgres is enough)
python -m scripts.migrations
python -m scripts.seed_data
uvicorn app.main:app --reload --port 8000
```

Seed logins (password `password123`): `customer@example.com`, `organizer@example.com`, `admin@example.com`.

- Health: http://localhost:8000/health  
- DB probe: http://localhost:8000/health/db (`skipped` until `DATABASE_URL` is set)
- Tests: `pytest` (in-memory SQLite; no Docker required)

## Environment variables

See [`.env.example`](.env.example). Never commit `.env`.

| Variable | Purpose |
|----------|---------|
| `APP_ENV` | `local` / `production` |
| `CORS_ORIGINS` | Comma-separated frontend origins (e.g. `http://localhost:5173`) |
| `DATABASE_URL` | Postgres connection URI (local Docker or Supabase) |
| `JWT_SECRET` | HS256 secret for local access tokens |
| `JWT_EXPIRE_MINUTES` | Token TTL (default 10080 = 7 days) |
| `SUPABASE_URL` | Optional; unused for auth |
| `SUPABASE_ANON_KEY` | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend-only if used; never expose to the browser |
| `SUPABASE_JWT_SECRET` | Fallback JWT secret only; not Supabase Auth |

Booking writes must go through this API so constraints enforce no double-booking. Reminder emails/SMS are out of scope; `POST /api/v1/admin/notifications/reminders` inserts inbox rows for events in the next 48 hours (no background worker).

## Docker (Hugging Face Spaces–compatible)

Image listens on port **7860** (HF default). Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) first (`docker --version` must work).

```powershell
cd backend
docker build -t seatflow-api .
docker run --rm --env-file .env -p 7860:7860 seatflow-api
```

Then open http://localhost:7860/health

If Docker is not installed yet, local `uvicorn` on port 8000 is enough for day-to-day development; build the image before pushing to Hugging Face.

### Hugging Face Space secrets

1. Create a Space with **Docker** SDK; use this `backend/` folder as the image root (or point the Space at this Dockerfile).
2. Add Space secrets matching `.env` (omit local-only values; set `APP_ENV=production`).
3. Set `CORS_ORIGINS` to your Vercel URL (and keep localhost while developing).
4. Smoke-test: `https://<user>-seatflow-api.hf.space/health`

## CORS contract

| Environment | Frontend origin | API base |
|-------------|-----------------|----------|
| Local | `http://localhost:5173` | `http://localhost:8000` |
| Deployed | `https://<project>.vercel.app` | `https://<user>-seatflow-api.hf.space` |
