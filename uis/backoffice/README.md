# TrackFlow Backoffice (Next.js 16 + React 19 + Tailwind v4)

Next.js application that serves the TrackFlow operational backoffice.  
Replaces the legacy static HTML pages with a modern App Router structure using React Server Components and Client Components.

All shared domain logic is imported from `@trackflow/core` (located in `src/` at the monorepo root) — no code duplication.

---

## Requirements

- Node.js 20+
- npm 10+
- FastAPI backend running on port 8000 (`services/api`)

---

## Running

```bash
# From the repo root, install all workspace deps once
npm install

# Start dev server (port 3001)
cd uis/backoffice
npm run dev
```

The `dev` script uses port 3001. FastAPI must be running on port 8000 or proxied data requests will fail with `ECONNREFUSED`.

## Languages

The `EN | ES` control in the navbar changes the complete interface immediately. The selected language is stored in `localStorage` under `lang`, so it persists across routes and browser reloads.

## Knowledge Base

The `/knowledge` view uses the shared TrackFlow palette and ES/EN translations,
including suggested questions, loading and retry states. It calls
`POST /api/agent/query` through the existing Next.js proxy, which forwards to
`POST /agent/query`. The shared API client attaches the current session JWT;
no browser-side service token is configured. The agent chooses incidents,
inventory, RAG or their combinations. Ticket/stock queries read the existing
authenticated managers; documentary
queries also require indexed Qdrant and the configured embedding/LLM services.
The legacy knowledge endpoint remains available but is no longer used by this view.

Agent errors with `detail.message` are displayed in the existing retry panel.
Operational failures and missing tickets produce honest agent answers instead of
invented states. The deployed desktop/mobile E2E report is in
[`evidence/support-agent-e2e.json`](../../evidence/support-agent-e2e.json): real
login, ticket, policy, mixed query, missing ticket, invalid JWT and recovery after
an explicitly injected HTTP 503. The temporary normal-user account was deleted;
incident storage was verified unchanged and no credentials are stored in the report.

Inventory by ID, SKU or product name is available through the same view; ambiguous
names request clarification rather than aggregating stock. Inventory E2E evidence
is in [`evidence/support-agent-inventory-e2e.json`](../../evidence/support-agent-inventory-e2e.json),
including all three sources together. Products, movements and incidents were
verified unchanged. Stock retains the existing inventory API's 30-second cache,
invalidated by its writes; the agent adds no cache.

In Docker, the API uses `QDRANT_URL=http://qdrant:6333` and depends on the Qdrant
service. A host-side `QDRANT_URL=http://localhost:6333` is not valid inside the
API container: it points back to the API container and causes query responses
with HTTP 503. After changing Compose, run `docker compose up -d api` to apply it.

---

## API proxy (rewrites)

The backoffice uses Next.js **rewrites** (`next.config.ts`) to proxy API calls to the FastAPI backend, keeping all requests same-origin from the browser:

```
/api/*       → http://localhost:8000/* (strips /api prefix)
/auth/*      → http://localhost:8000/auth/*
/users/*     → http://localhost:8000/users/*
/profiles/*  → http://localhost:8000/profiles/*
```

`/api/reporting/*` is proxied to the authenticated FastAPI reporting router, including `/api/reporting/sales-forecast` for the sales forecast view.

> 💡 The frontend uses `API_BASE = "/api"` in `lib/constants.ts`. All fetch calls (e.g. `fetch("/api/suppliers")`) are proxied to the backend without the `/api` prefix. Routes called directly by `@trackflow/core` (login, register) use `/auth/*` and `/users/*` rewrites directly.

---

## Routes

| Route | Auth | Description |
|---|---|---|
| `/login` | No | Login form (email + password → JWT) |
| `/register` | No | Registration form |
| `/` | JWT | Dashboard — inventory, shipments & carriers |
| `/suppliers` | JWT | Supplier directory CRUD |
| `/incidents` | JWT | CSV incident analyzer |
| `/knowledge` | JWT | Knowledge assistant with suggested questions and generated answers |
| `/sales-forecast` | JWT | TrackFlow consolidated revenue forecast, test metrics, variability band and annual filters |
| `/account/profile` | JWT | User profile management |

> Protected routes require a valid JWT stored in `localStorage` (`trackflow_token`).

---

## How to launch (full stack)

### 1. FastAPI Backend (port 8000)

```bash
cd services/api
source venv/bin/activate
uv run seed                # optional: sample suppliers
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Backoffice (port 3001)

```bash
cd uis/backoffice
npm run dev
```

### 3. Open in browser

```
http://localhost:3001
```

- **Login**: `http://localhost:3001/login`
- **Register**: `http://localhost:3001/register`
- **Dashboard**: `http://localhost:3001/` (after login)

---

## Architecture

```
uis/backoffice/
├── app/                    # Next.js App Router pages
│   ├── login/page.tsx      # Login (Suspense-wrapped)
│   ├── register/page.tsx   # Registration
│   ├── page.tsx            # Dashboard (protected)
│   ├── suppliers/page.tsx  # Supplier CRUD (protected)
│   ├── incidents/page.tsx  # Incident analyzer (protected)
│   └── account/profile/page.tsx  # User profile (protected)
├── components/             # Shared UI components
├── hooks/                  # Custom hooks (useDashboard, useSuppliers, useIncidentAnalyzer)
├── services/api.ts         # API fetch wrapper (uses API_BASE + rewrites)
├── lib/constants.ts        # Config (API_BASE, categories, etc.)
├── next.config.ts          # Rewrites + transpilePackages
└── tsconfig.json           # Path aliases
```

## Shared package (`@trackflow/core`)

The backoffice imports all shared logic from the monorepo `src/` barrel:

```ts
import { login, register, getToken, getAuthMe, getProfile, updateProfile }
  from "@trackflow/core";
import { filterProductsByWarehouse, sortCarriersByReliability, selectBestCarrier, ... }
  from "@trackflow/core";
import type { Product, Shipment, Carrier, User, ... }
  from "@trackflow/core";
```

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 3001) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |

---

## Troubleshooting

### `another next dev server is already running`

Kill the existing server:

```bash
lsof -ti:3001 | xargs kill
npm run dev
```

### API requests return 404

Ensure FastAPI is running on port 8000 and the rewrites in `next.config.ts` are pointing to the correct URL. Check with:

```bash
curl http://localhost:8000/api/health
```

### Login fails with "Email o contraseña incorrectos"

Make sure you registered first. The FastAPI backend must be running on port 8000.
