# TrackFlow Talent Pipeline Tracker (Next.js 16 + React 19 + Tailwind v4)

Next.js application that manages recruitment records (list, detail, notes, status/stage updates) with full authentication integrated with the TrackFlow FastAPI backend.

Part of the **TrackFlow monorepo** (npm workspaces). All shared domain logic is imported from `@trackflow/core` (located in `src/` at the monorepo root) — no code duplication.

---

## Requirements

- Node.js 20+
- npm 10+
- FastAPI backend running at port `8000` (`services/api`)

---

## Run locally

### 1. Install workspace dependencies (once)

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa
npm install
```

### 2. Start backend API

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/services/api
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Start Next.js app

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/talent-pipeline-tracker
npm run dev
```

Open `http://localhost:3002`.

---

## Routes

| Route | Description |
|---|---|
| `/` | Home / candidate list (protected) |
| `/login` | Login form |
| `/register` | Registration form |
| `/account/profile` | Current user profile (protected) |
| `/candidates/[id]` | Candidate detail (protected) |

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 3002) |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |

---

## Architecture

```
uis/talent-pipeline-tracker/
├── app/
│   ├── layout.tsx                     # Root layout (AuthGuard)
│   ├── page.tsx                       # Home / candidate list
│   ├── login/
│   │   └── page.tsx                   # Login page
│   ├── register/
│   │   └── page.tsx                   # Registration page
│   ├── account/
│   │   └── profile/
│   │       └── page.tsx               # Account profile
│   └── candidates/
│       └── [id]/
│           └── page.tsx               # Candidate detail
├── components/
│   └── AuthGuard.tsx                  # Route protection guard
├── lib/                                # Constants, fetchers
├── services/                           # API service functions
├── types/                              # TypeScript types
└── next.config.ts                      # transpilePackages for @trackflow/core
```

## Shared package (`@trackflow/core`)

The tracker imports shared logic from the monorepo `src/` barrel:

```ts
import { requireAuth, getAuthHeaders, handleAuthError, ... }
  from "@trackflow/core";
import type { Candidate, Note, RecruitmentStage, User, ... }
  from "@trackflow/core";
```

---

## Authentication and account management

The tracker shares users with the backoffice and uses the same backend endpoints:

- `POST /users` — register
- `POST /auth/login` — login
- `GET /auth/me` — current user
- `PUT /profiles/me` — update profile

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

To avoid browser CORS issues between ports `3002` and `8000`, the tracker uses a Next.js Route Handler proxy:

- Local proxy route: `/api/auth-proxy/*`
- File: `app/api/auth-proxy/[...path]/route.ts`
- Upstream backend base: `AUTH_API_BASE` env var (default: `http://127.0.0.1:8000`)

This keeps auth requests same-origin from the browser perspective.

---

## Codespaces URLs

| Service | URL |
|---|---|
| Website | `https://<codespace-name>-3000.app.github.dev` |
| Backoffice | `https://<codespace-name>-3001.app.github.dev` |
| Talent Pipeline | `https://<codespace-name>-3002.app.github.dev` |
| API | `https://<codespace-name>-8000.app.github.dev` |

With the auth proxy enabled, login/register/profile calls are sent to `3002` and proxied server-side to `8000`.

---

## Troubleshooting

### `port already in use`

```bash
lsof -ti:3002 | xargs kill
npm run dev
```

### `sh: next: not found`

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa
npm install
cd uis/talent-pipeline-tracker
npm run dev
```
