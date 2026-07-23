# Seat-Flow Architecture (MVP)

## Canonical stack

| Layer | Technology | Host |
|-------|------------|------|
| Frontend | React + TypeScript (Vite) | **Vercel** |
| API | FastAPI + Uvicorn (Docker) | **Hugging Face Spaces** |
| Database | PostgreSQL | **Supabase** |
| Auth | Supabase Auth (JWT) | **Supabase** |

Booking writes go through the FastAPI API so seat uniqueness and transactions stay enforced in PostgreSQL.

## Explicitly out of scope for MVP hosting

- AWS DynamoDB
- AWS Lambda / Mangum / API Gateway as the primary API runtime
- EKS, App Runner, Fargate, or EC2 as required hosting

## Backend MVC layout

Each domain under `app/` follows:

`router` → `controller` → `service` → `repository` (+ `schemas` / `models`)

Domains mounted at `/api/v1/...`:

- `auth`, `users`, `events`, `seats`, `bookings`, `notifications`, `analytics`, `admin`

Smoke endpoints:

- `GET /health`
- `GET /health/db`
- `GET /api/v1/<domain>/ping` (MVC wiring stubs)

## Configuration

Secrets live in `backend/.env` (never committed). See `.env.example` for required keys:

- `DATABASE_URL` — Supabase Postgres connection string
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- `CORS_ORIGINS` — comma-separated frontend origins (e.g. `http://localhost:5173`)

## Deployment notes

See [deployment.md](./deployment.md) for Hugging Face Space Docker and Vercel wiring.
