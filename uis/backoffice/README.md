# TrackFlow Backoffice (HTML + TypeScript bundle)

This folder contains the static backoffice pages (`index.html`, `suppliers.html`, `incidents.html`, `login.html`, `register.html`, `profile.html`) and the browser bundle (`js/app.js`) generated from `src/ui/handlers.ts`.

The backoffice is meant to be served by the FastAPI app in `services/api`, not by a standalone frontend dev server.

---

## Requirements

- Node.js 20+
- npm 10+
- Python 3.10+
- `uv`

Quick check:

```bash
node -v
npm -v
uv --version
```

---

## Routes you can open in the browser

When the API is running on port `8000`, these pages are available:

- `/login` → login
- `/register` → account creation
- `/` → backoffice main panel (protected)
- `/suppliers.html` → supplier directory (protected)
- `/incidents.html` → incident analyzer (protected)
- `/account/profile` → current user profile (protected)

Legacy routes (`/login.html`, `/register.html`, `/profile.html`) are kept as aliases.

Protected routes require a valid JWT token stored in `localStorage` (`trackflow_token`).

---

## End-to-end launch process (recommended)

### 1. Build the backoffice bundle

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
npm run build
```

### 2. Start the API server (which also serves this UI)

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/services/api
uv sync
uv run seed   # optional sample suppliers
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Open and authenticate

1. Open `http://localhost:8000/register` to create an account.
2. Then login at `http://localhost:8000/login`.
3. After login you are redirected to `http://localhost:8000/`.
4. Navigate to suppliers and incidents from the top navigation.

---

## Development workflow

Use auto-rebuild while editing `src/`:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build:watch
```

Keep the FastAPI server running in another terminal.

---

## Available scripts

| Command | Description |
|---|---|
| `npm run build` | Bundles `../../src/ui/handlers.ts` into `js/app.js` |
| `npm run build:watch` | Rebuilds automatically on file changes |

---

## Codespaces access

If you run this in GitHub Codespaces, use the forwarded port URL for `8000`:

- `https://<codespace-name>-8000.app.github.dev/login`

You can find the exact URL in the VS Code Ports panel.

---

## Troubleshooting

### UI loads but actions do nothing

Bundle might be outdated. Rebuild:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build
```

### 401 Unauthorized or automatic redirect to login

The token is missing or expired. Login again at `/login`.

### `sh: esbuild: not found`

Install dependencies in backoffice:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
```

### API server is not reachable

Start/restart FastAPI in `services/api`:

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
