# TrackFlow API (FastAPI)

Unified backend for TrackFlow. This service exposes business APIs and also serves the backoffice pages.

Includes:

- Incident Analyzer (`/api/incidents/*`)
- Supplier Directory (`/suppliers/*`)
- Auth and Users (`/auth/*`, `/users/*`, `/profiles/*`)
- Backoffice frontend pages (`/`, `/login`, `/register`, `/account/profile`, etc.)

---

## Requirements

- Python 3.10+
- `uv`
- Node.js + npm (only to build `uis/backoffice/js/app.js`)

```bash
pip install uv
```

---

## End-to-end launch process

### 1. Build the backoffice bundle

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
npm run build
```

### 2. Install API dependencies

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/services/api
uv sync
```

### 3. Optional seed (suppliers sample data)

```bash
uv run seed
```

### 4. Start the server

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Open and use the app

1. Open `http://localhost:8000/register` to create a user.
2. Login at `http://localhost:8000/login`.
3. Enter the backoffice at `http://localhost:8000/`.

---

## Browser routes

| Route | Purpose | Access |
|---|---|---|
| `/register` | Create user account | Public |
| `/login` | Login and get session in browser | Public |
| `/` | Main backoffice panel | Protected |
| `/suppliers.html` | Supplier UI | Protected |
| `/incidents.html` | Incident analyzer UI | Protected |
| `/account/profile` | Current user profile UI | Protected |

Legacy aliases are also available:

- `/register.html`
- `/login.html`
- `/profile.html`

---

## API routes

### Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/users` | Register user |
| `POST` | `/auth/login` | Login (returns JWT token) |

### Protected (Bearer token required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/auth/me` | Current authenticated user |
| `GET` | `/profiles/me` | Current user profile |
| `PUT` | `/profiles/me` | Update current profile |
| `GET` | `/users` | List users (admin only) |
| `GET` | `/users/{id}` | Get user by id |
| `PUT` | `/users/{id}` | Update user |
| `DELETE` | `/users/{id}` | Delete user (admin only) |
| `POST` | `/api/incidents/analyze` | Analyze uploaded CSV |
| `GET` | `/api/incidents/results/export` | Export last analysis as CSV |
| `POST` | `/suppliers` | Create supplier |
| `GET` | `/suppliers` | List suppliers (`?country=...&category=...`) |
| `GET` | `/suppliers/{id}` | Get supplier by ID |
| `PATCH` | `/suppliers/{id}/rate` | Update supplier rate |
| `PATCH` | `/suppliers/{id}/status` | Update supplier status |
| `DELETE` | `/suppliers/{id}` | Delete supplier |

---

## Quick API test with curl

```bash
# Health (public)
curl -s http://localhost:8000/api/health | python3 -m json.tool

# Register user (public)
curl -s -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@trackflow.com","password":"secret123"}' | python3 -m json.tool

# Login (public)
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@trackflow.com","password":"secret123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Protected example
curl -s http://localhost:8000/suppliers \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## Codespaces

Use the forwarded port `8000` URL, for example:

- `https://<codespace-name>-8000.app.github.dev/login`

---

## Troubleshooting

### You can open pages, but API calls fail with 401

Login again at `/login`. Protected endpoints require a valid JWT.

### `GET /js/app.js` returns 404

The backoffice bundle has not been built yet. Run:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build
```

### `uv: command not found`

Install `uv`:

```bash
pip install uv
```
