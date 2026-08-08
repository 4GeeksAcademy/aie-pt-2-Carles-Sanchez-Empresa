# TrackFlow Backoffice (HTML + TypeScript bundle)

This project contains the manual TrackFlow backoffice panel served as static HTML and powered by a browser bundle generated from the monorepo TypeScript source.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Python 3 available in the environment

Quick check:

```bash
node -v
npm -v
python3 --version
```

## Relevant structure

- `index.html` static backoffice UI
- `js/app.js` browser bundle consumed by the page
- `package.json` build and watch scripts for the UI bundle
- `../../src/` source of truth for business logic, sample data, and UI handlers

## Source of truth

The business logic is not maintained inside `uis/backoffice/`.

- `src/utils/` contains the business logic
- `src/types/` contains the domain types
- `src/data/sampleData.ts` contains sample data
- `src/ui/handlers.ts` is the browser entrypoint bundled for the backoffice

## Installation

From the project folder:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
```

## Build the backoffice

```bash
npm run build
```

This generates:

- `js/app.js`

## Rebuild automatically while editing

```bash
npm run build:watch
```

Use this when editing files under `src/` that are consumed by the backoffice.

## Serve locally

After building, serve the folder with a static HTTP server:

```bash
python3 -m http.server 8126
```

Then open:

```bash
http://127.0.0.1:8126
```

## Recommended future workflow

Terminal 1:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm run build:watch
```

Terminal 2:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
python3 -m http.server 8126
```

## Available scripts

- `npm run build`: bundles `../../src/ui/handlers.ts` into `js/app.js`
- `npm run build:watch`: rebuilds the bundle automatically on changes

## Expected status

If everything is correct:

- `npm run build` finishes without errors
- `js/app.js` is generated successfully
- `python3 -m http.server 8126` serves the panel locally
- The results of the business logic are visible in the UI, not only in the console

## Troubleshooting

### The page opens but buttons do nothing

Usually `js/app.js` has not been generated yet.

1. Make sure you are in the correct folder:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
```

2. Build again:

```bash
npm run build
```

3. Refresh the browser.

### Error `sh: esbuild: not found`

Local dependencies are missing.

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/backoffice
npm install
```

### Changes in `src/` are not reflected

Rebuild the bundle:

```bash
npm run build
```

Or keep the watcher running:

```bash
npm run build:watch
```