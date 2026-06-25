# JobTrackr — Agent Guide

## Project Overview
JobTrackr is a full-stack job application tracker. Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui. Backend: FastAPI + SQLAlchemy 2.0 (async) + Alembic + SQLite (dev) / PostgreSQL (prod). Auth: Google OAuth 2.0 server-side Authorization Code Flow with httpOnly JWT cookies. PDF export via WeasyPrint. AI cover letter review via Google Gemini 2.5 Flash.

## Dev Server Commands

### Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm run dev   # runs on port 5173
```

Both must run simultaneously. Frontend proxies `/auth` and `/api` to `localhost:8000` via Vite config — this is how cookies work in dev without CORS issues.

## Environment Variables

### backend/.env (copy from backend/.env.example)
```
DATABASE_URL=sqlite+aiosqlite:///./jobber_buddy.db
SECRET_KEY=<openssl rand -hex 32>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
ENVIRONMENT=development
GEMINI_API_KEY=<from aistudio.google.com/apikey>
```

### frontend/.env (copy from frontend/.env.example)
```
VITE_APP_NAME=JobTrackr
```
No API base URL needed in dev — Vite proxy handles it.

## Database Migrations

```bash
cd backend
source .venv/bin/activate

# Create a new migration after changing models
alembic revision --autogenerate -m "describe what changed"

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1
```

Note: Alembic uses a sync SQLite URL (`sqlite:///./jobber_buddy.db`) in `alembic/env.py` only. The app runtime uses `sqlite+aiosqlite:///./jobber_buddy.db`.

## Key Architecture Decisions

### Auth: httpOnly Cookie + Server-Side OAuth
- The Google `client_secret` never leaves the backend.
- JWTs are stored in `httpOnly; SameSite=Lax` cookies — not localStorage.
- The Vite dev proxy makes frontend requests same-origin, so cookies are sent automatically.
- On 401 from any API call, the frontend clears user state and redirects to `/`.

### CORS
- `allow_credentials=True` requires an explicit `allow_origins` list — NOT `"*"`.
- Currently allows `http://localhost:5173` (dev). Update for production.

### SQLite FK Enforcement
- SQLite does not enforce FKs by default. We add `PRAGMA foreign_keys = ON` via an SQLAlchemy engine event listener in `database.py`.

### WeasyPrint System Dependencies (macOS)
```bash
brew install pango cairo
```
On Ubuntu/Debian: `apt-get install libpango-1.0-0 libpangoft2-1.0-0 libcairo2`

### Monaco Editor
Always lazy-loaded via `React.lazy(() => import("@monaco-editor/react"))` to avoid ~2MB initial bundle.

## API Route Inventory

### Auth (no auth required)
- `GET  /auth/google`           → redirect to Google OAuth
- `GET  /auth/google/callback`  → exchange code, set cookie, redirect to frontend
- `GET  /auth/me`               → current user (requires cookie)
- `POST /auth/logout`           → delete cookie

### Applications (all require auth cookie)
- `GET    /api/v1/applications`       → list (optional: ?status=, ?sort=, ?order=)
- `POST   /api/v1/applications`       → create (201)
- `GET    /api/v1/applications/{id}`  → detail
- `PUT    /api/v1/applications/{id}`  → update
- `DELETE /api/v1/applications/{id}`  → 204

### Documents (all require auth cookie)
- `GET    /api/v1/documents`              → list (optional: ?type=resume|cover_letter)
- `POST   /api/v1/documents`             → create
- `GET    /api/v1/documents/{id}`        → detail (includes content_md)
- `PUT    /api/v1/documents/{id}`        → update
- `DELETE /api/v1/documents/{id}`        → 204
- `POST   /api/v1/documents/{id}/export-pdf`  → returns PDF binary
- `POST   /api/v1/documents/{id}/review`      → streams Claude AI feedback (SSE)

## shadcn/ui Components Used
button, dialog, tabs, badge, select, input, textarea, table, accordion,
dropdown-menu, avatar, skeleton, separator, tooltip, scroll-area, sheet

## Application Status Values
applied | screening | interview | technical_interview | technical_interview_2 | offer | rejected | withdrawn

## Common Tasks

### Add a new field to JobApplication
1. Edit `backend/app/models/application.py`
2. Edit `backend/app/schemas/application.py` (both Create and Response schemas)
3. Run `alembic revision --autogenerate -m "add field X"` + `alembic upgrade head`
4. Update `frontend/src/types/application.ts`
5. Update `ApplicationModal.tsx` and `ApplicationsGrid.tsx` as needed

### Add a new API route
1. Add the function to the appropriate router in `backend/app/routers/`
2. Add the fetch function to the corresponding file in `frontend/src/api/`
3. Add TanStack Query key + hook in `frontend/src/hooks/`

### Reset the database (dev only)
```bash
cd backend
rm -f jobber_buddy.db
alembic upgrade head
```

## Google Cloud Console Setup
1. Go to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID → Web application
3. Authorized JavaScript Origins: `http://localhost:5173`
4. Authorized Redirect URIs: `http://localhost:8000/auth/google/callback`
5. Copy Client ID + Secret to `backend/.env`
