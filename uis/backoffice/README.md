# TrackFlow Backoffice (HTML + TypeScript bundle)

This project contains the manual TrackFlow backoffice panel served as static HTML and powered by a browser bundle generated from the monorepo TypeScript source.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Python 3.10+ with `uv` installed

Quick check:

```bash
node -v
npm -v
uv --version
```

## Relevant structure

- `index.html` — static backoffice UI
- `js/app.js` — browser bundle consumed by the page
- `package.json` — build and watch scripts for the UI bundle
- `../../src/` — source of truth for business logic, sample data, and UI handlers

## Source of truth

The business logic is not maintained inside `uis/backoffice/`.

- `src/utils/` contains the business logic
- `src/types/` contains the domain types
- `src/data/sampleData.ts` contains sample data
- `src/ui/handlers.ts` is the browser entrypoint bundled for the backoffice

---

## Step-by-step setup (with FastAPI server) — RECOMMENDED

This is the recommended way, as the backoffice is served through the same FastAPI server.

### 1. Build the TypeScript bundle

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
npm run build
```

### 2. Start the FastAPI server (with uv)

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/services/api
uv sync          # if you haven't already
uv run seed      # optional: seed example suppliers
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Open in the browser

[http://localhost:8000](http://localhost:8000)

The FastAPI server serves:
- `/` → `index.html`
- `/incidents.html` → incident analyzer
- `/suppliers.html` → supplier directory
- `/js/app.js` → compiled TypeScript bundle

---

## Alternative: static HTTP server

If you only want to view the static HTML (no API connection), use a simple HTTP server:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build
python3 -m http.server 8126
```

[http://127.0.0.1:8126](http://127.0.0.1:8126)

> ⚠️ With this option, the suppliers (`suppliers.html`) and incidents pages will NOT connect to the API.

---

## Development: auto-rebuild on changes

Keep this running in a terminal while editing `src/`:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build:watch
```

This regenerates `js/app.js` whenever TypeScript source files change.

---

## Available scripts

| Command | Description |
|---|---|
| `npm run build` | Bundles `../../src/ui/handlers.ts` into `js/app.js` |
| `npm run build:watch` | Rebuilds the bundle automatically on changes |

---

## Expected status

If everything is correct:

- `npm run build` finishes without errors
- `js/app.js` is generated successfully
- The FastAPI server starts without errors
- The backoffice pages load correctly at `http://localhost:8000`
- Business logic results are visible in the UI, not only in the console

---

## Troubleshooting

### The page opens but buttons do nothing

Usually `js/app.js` has not been generated yet.

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build
```

Refresh the browser.

### Error `sh: esbuild: not found`

Local dependencies are missing.

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
```

### Changes in `src/` are not reflected

Rebuild the bundle:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build
```

Or keep the watcher running: `npm run build:watch`

### Error `bash: uv: command not found`

```bash
pip install uv
```

### Server won't start because port is in use

```bash
# Change the port on the FastAPI server
uv run uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```