# JobTrackr

A personal job application tracker with Google SSO, a rich application grid, Markdown-based document editor, PDF export, and AI-powered cover letter review.

## Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + SQLAlchemy 2.0 (async) + Alembic
- **Auth**: Google OAuth 2.0 (server-side, httpOnly cookies)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **PDF**: WeasyPrint (Markdown → HTML → PDF)
- **AI**: Google Gemini 2.5 Flash (cover letter review)

## Prerequisites

- Python 3.11+
- Node.js 18+
- macOS: `brew install pango cairo` (for PDF export)
- Ubuntu: `apt-get install libpango-1.0-0 libpangoft2-1.0-0`

## Setup

### 1. Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add Authorized Redirect URI: `http://localhost:8000/auth/google/callback`
4. Copy the Client ID and Secret

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SECRET_KEY, ANTHROPIC_API_KEY

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install

cp .env.example .env

npm run dev    # runs on http://localhost:5173
```

### 4. Open the app

Navigate to [http://localhost:5173](http://localhost:5173) and sign in with Google.

## Features

- **Application Grid**: Track all job applications with status, company, title, location, salary, date applied
- **Status Tracking**: applied → screening → interview → technical interview → offer / rejected / withdrawn
- **Application Detail Modal**: tabs for overview, full job description (with parsed sections), linked resume/cover letter, and notes
- **Document Editor**: Markdown editor with live preview for resumes and cover letters
- **PDF Export**: Download any document as a professionally formatted PDF
- **AI Cover Letter Review**: Paste a job description and get Claude's analysis of your cover letter

## Development

See [CLAUDE.md](./CLAUDE.md) for full agent/maintenance guide including migration commands, architecture decisions, and common tasks.
