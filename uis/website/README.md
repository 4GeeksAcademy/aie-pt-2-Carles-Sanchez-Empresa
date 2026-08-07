# TrackFlow Website (React + TypeScript + Tailwind)

This project contains the migration of the static TrackFlow website into reusable React components with TypeScript and Tailwind styling.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

Quick check:

```bash
node -v
npm -v
```

## Relevant structure

- `src/` React pages and components
- `public/media/` images and visual assets
- `src/utils/applicationValidation.ts` form validation logic

## Installation

From the project folder:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/website
npm install --no-package-lock
```

Note:
- `--no-package-lock` is used to avoid generating `package-lock.json` in this repository.

## Run in development

```bash
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`).

## Check TypeScript typing

```bash
npm run typecheck
```

## Build for production

```bash
npm run build
```

## Preview production build

```bash
npm run preview
```

## Available scripts

- `npm run dev`: starts the development server
- `npm run typecheck`: validates types without emitting files
- `npm run build`: builds for production
- `npm run preview`: serves the built output

## Application routes

- `/` main landing page
- `/application` request form

## Troubleshooting

### Error `sh: vite: not found` or exit code `127`

This usually happens when local dependencies are missing.

1. Make sure you are in the correct folder:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa/uis/website
```

2. Reinstall dependencies:

```bash
npm install --no-package-lock
```

3. Run again:

```bash
npm run dev
```

### Port already in use

If the default port is busy, Vite will automatically suggest another one.

## Expected status

If everything is correct:

- `npm run typecheck` finishes without errors
- `npm run build` generates `dist/` successfully
- `npm run dev` serves the app locally
