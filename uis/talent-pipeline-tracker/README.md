# TrackFlow Talent Pipeline Tracker (Next.js)

This app manages recruitment records (list, detail, notes, status/stage updates) and now includes full authentication integrated with the TrackFlow FastAPI backend.

---

## Requirements

- Node.js 20+
- npm 10+
- FastAPI backend running at port 8000 (`services/api`)

---

## Run locally

### 1. Start backend API

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/services/api
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Start Next.js app

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/talent-pipeline-tracker
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## Authentication and account management

The tracker shares users with the backoffice and uses the same backend endpoints:

- `POST /users` (register)
- `POST /auth/login` (login)
- `GET /auth/me` (current user)
- `PUT /profiles/me` (update profile)

### Frontend routes

- `/login` -> login form
- `/register` -> registration form
- `/account/profile` -> current user account profile
- `/` and `/candidates/[id]` -> protected app views

### Route protection

Client-side guard is implemented in `components/AuthGuard.tsx` and applied from `app/layout.tsx`.

- If token is missing/invalid in `localStorage`, user is redirected to `/login`.
- If login/register are visited with a valid token, user is redirected to `/`.

### Token lifecycle

- Login/register save JWT in `localStorage` (`trackflow_token`).
- Protected API calls attach `Authorization: Bearer <token>`.
- Logout clears token and redirects to `/login`.
- Any `401` response clears session and redirects to `/login?reason=session_expired`.

---

## CORS-safe auth proxy (Codespaces/local)

To avoid browser CORS issues between ports `3000` and `8000`, the tracker uses a Next.js Route Handler proxy:

- Local proxy route: `/api/auth-proxy/*`
- File: `app/api/auth-proxy/[...path]/route.ts`
- Upstream backend base: `AUTH_API_BASE` env var (default: `http://127.0.0.1:8000`)

This keeps auth requests same-origin from the browser perspective.

---

## Useful scripts

```bash
npm run dev
npm run build
npm run lint
```

---

## Codespaces notes

- Tracker usually runs on `https://<codespace-name>-3000.app.github.dev`
- API usually runs on `https://<codespace-name>-8000.app.github.dev`

With the auth proxy enabled, login/register/profile calls are sent to `3000` and proxied server-side to `8000`.
