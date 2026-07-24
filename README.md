# SeatFlow

Industry-grade and university-ready software engineering repository for the **SeatFlow** Event Seat Booking and Management System.

The current frontend UI is based on the Figma design: https://www.figma.com/design/vgCGVHd66W1ps2RDp6FpOg/Implement-Design-from-Files

## Technology Stack (MVP)

| Layer | Technology | Host (free tier) |
|---|---|---|
| Frontend | React (TypeScript) + Vite | Vercel |
| Backend API | FastAPI + Uvicorn (Docker) | Hugging Face Spaces |
| Database | PostgreSQL (SQL) | Supabase |
| Authentication | Supabase Auth (JWT) | Supabase |

Canonical product scope: [`MVP/SeatFlow_MVP_Document.md`](MVP/SeatFlow_MVP_Document.md).

## Local environment setup

### Prerequisites
- Node.js 20+ (`node -v`)
- Python 3.11+ (`python --version`)
- Git (`git --version`)
- Docker Desktop (for local Postgres)

### Quick start (recommended)

From the **repo root**:

```powershell
npm run setup
npm run dev
```

This starts:
- Docker Postgres on `localhost:5432`
- FastAPI on `http://127.0.0.1:8000` (docs: `/docs`)
- Vite React on `http://localhost:3000`

Demo accounts (seeded):
- `customer@example.com` / `password123`
- `organizer@example.com` / `password123`

### Manual start (optional)

**Backend**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
docker compose up -d postgres
python -m scripts.migrations
python -m scripts.seed_data
uvicorn app.main:app --reload --port 8000
```

**Frontend** (separate terminal)

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Details: [`backend/README.md`](backend/README.md) · [`frontend/README.md`](frontend/README.md)

## Documentation

Key product and planning docs live under [`MVP/`](MVP) and [`project_issues/`](project_issues).
