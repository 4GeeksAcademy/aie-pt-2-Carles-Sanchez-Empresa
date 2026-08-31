# TrackFlow Website (Next.js 16 + React 19 + Tailwind v4)

Next.js application that serves the TrackFlow corporate website.  
Migrated from React + Vite to Next.js App Router.

All shared domain logic is imported from `@trackflow/core` (located in `src/` at the monorepo root) — no code duplication.

---

## Requirements

- Node.js 20+
- npm 10+

---

## Running

```bash
# From the repo root, install all workspace deps once
npm install

# Start dev server (port 3000)
cd uis/website
npm run dev
```

---

## Routes

| Route | Description |
|---|---|
| `/` | Main landing page |
| `/application` | TrackFlow request form |

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run typecheck` | Validate TypeScript types without emitting |

---

## Architecture

```
uis/website/
├── app/
│   ├── page.tsx            # Landing page
│   ├── layout.tsx          # Root layout
│   └── application/
│       └── page.tsx        # Request form
├── components/             # Reusable UI components
├── public/media/           # Images and assets
└── next.config.ts          # transpilePackages for @trackflow/core
```

## Shared package (`@trackflow/core`)

The website imports shared logic from the monorepo `src/` barrel:

```ts
import { validateProduct, validateShipment, validateCarrier, ... }
  from "@trackflow/core";
import type { Product, Shipment, Carrier, ApplicationFormData, ... }
  from "@trackflow/core";
```

---

## Troubleshooting

### `port already in use`

Next.js will automatically suggest the next available port. Or kill the existing process:

```bash
lsof -ti:3000 | xargs kill
npm run dev
```

### `sh: next: not found`

Make sure dependencies are installed:

```bash
cd /workspaces/aie-pt-2-Carles-Sanchez-Empresa
npm install
cd uis/website
npm run dev
```
