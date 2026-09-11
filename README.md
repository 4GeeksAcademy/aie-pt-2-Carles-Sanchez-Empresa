# AI Engineering Company Project — Student Template

[![4Geeks Academy](https://img.shields.io/badge/4Geeks-Academy-blue)](https://4geeksacademy.com)
[![AI Engineering](https://img.shields.io/badge/track-AI%20Engineering-green)](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)

_Base template for transversal projects in the AI Engineering Career Program — 4Geeks Academy._

> _Instrucciones disponibles en español en [README.es.md](./README.es.md)._

---

## Purpose

This repository is the **starter template** for transversal projects. You will work on real company scenarios (Brasaland, TrackFlow, Nexova), building deliverables that map to course milestones (Web, Programming, Backend, Telemetry, RAG, Agents, Workflows, Real-time).

- Create a template from this repository.
- Replace the placeholder `CONTEXT.md` with your assigned company context.
- Use `skills/` and the directory-level `README.md` files as working guidance.

---

## Current status of the template

The repository currently provides the **base folder structure and documentation skeleton**, plus the following **implemented deliverables**:

| Deliverable | Location | Status |
|---|---|---|
| **Shared domain logic** (types, collections, search, transformations, validations, auth) | `src/` (`@trackflow/core`) | ✅ Complete |
| **Backoffice** (Next.js 16 + React 19 + Tailwind v4) | `uis/backoffice/` | ✅ Complete |
| **Corporate website** (Next.js 16 + React 19 + Tailwind v4) | `uis/website/` | ✅ Complete |
| **Talent Pipeline Tracker** (Next.js 16 + React 19 + Tailwind v4) | `uis/talent-pipeline-tracker/` | ✅ Complete |
| **Skills** — Carrier Selection Optimizer, Returns Triage Assistant | `skills/` | ✅ Complete |
| **Architecture proposal** (Hexagonal + FastAPI) | `docs/ARCHITECTURE_PROPOSAL.md` | ✅ Complete |
| **Incident Analyzer API** — FastAPI backend for CSV incident analysis | `services/api/` | ✅ Complete |

> All previous placeholder text (`CONTEXT.md`, `AGENTS.md`, `company-choice.md`) has been replaced with TrackFlow-specific content.

---

## Repository structure

```text
ai-engineering-company-project-monorepo/
├── README.md
├── README.es.md
├── CONTEXT.md
├── AGENTS.md
├── company-choice.md
├── package.json              # npm workspaces root (monorepo)
├── agents/                   # Agent patterns/templates and tools docs
├── data/                     # raw, process, pipelines, eval
├── docs/                     # Project and architecture documentation
├── infra/                    # Docker, Terraform, deployment configs
├── internal/                 # CLIs, packaged migration scripts, internal utilities
├── mcps/                     # Model Context Protocol (MCP) Servers
├── packages/
│   └── shared/               # Shared package (@repo/shared-types)
├── scripts/                  # Script conventions/documentation
├── services/
│   └── api/                  # FastAPI backend (auth, users, suppliers, incidents, profiles)
├── shared/                   # Shared assets/conventions at repo level
├── skills/                   # Reusable agent skills
├── src/                      # @trackflow/core — shared TS logic used by all UIs
├── uis/
│   ├── backoffice/           # Next.js 16 app (port 3001)
│   ├── website/              # Next.js 16 app (port 3000)
│   └── talent-pipeline-tracker/  # Next.js 16 app (port 3002)
└── workflows/                # Automation/orchestration documentation
```

### npm workspaces monorepo

The root `package.json` defines workspaces:

```
["src", "packages/shared", "uis/website", "uis/backoffice", "uis/talent-pipeline-tracker"]
```

All UIs share logic from `src/` via the `@trackflow/core` package (barrel exports from `src/index.ts`), using path aliases (`@trackflow/core` → `../../src`) and Next.js `transpilePackages`. No code duplication.

---

## How to start

1. **Use this repository as a template** and create your own project repo.
2. **Clone** your repository (or open it in Codespaces).
3. **Replace** `CONTEXT.md` with the full context for your assigned company.
4. **Review** each top-level folder `README.md` to understand intended responsibilities (`uis/`, `services/`, `data/`, `skills/`, etc.).
5. **Start implementing** milestone deliverables in `uis/` and `services/`, reusing `packages/shared/` and `data/` as needed.

---

## How to start

1. **Use this repository as a template** and create your own project repo.
2. **Clone** your repository (or open it in Codespaces).
3. **Replace** `CONTEXT.md` with the full context for your assigned company.
4. **Review** each top-level folder `README.md` to understand intended responsibilities (`uis/`, `services/`, `data/`, `skills/`, etc.).
5. **Start implementing** milestone deliverables in `uis/` and `services/`, reusing `packages/shared/` and `data/` as needed.

---

## Running the project (monorepo)

This monorepo uses **npm workspaces**. All Next.js UIs share domain logic from `src/` (`@trackflow/core`).  
Each service runs on a different port so they can coexist locally or in Codespaces.

### Prerequisites

```bash
# From the repository root, install all workspace dependencies once
npm install
```

### 🖥️ FastAPI Backend (port 8000)

```bash
cd services/api
uv sync                    # install Python deps
source venv/bin/activate   # enter virtual environment
uv run seed                # optional: populate sample suppliers
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

> ⚠️ Run `uvicorn` **inside** the venv (`source venv/bin/activate` first), or use `uv run uvicorn main:app ...` as an alternative.

API endpoints:

| Endpoint | Auth | Description |
|---|---|---|
| `GET  /api/health` | No | Health check |
| `POST /auth/login` | No | Login (email + password → JWT) |
| `POST /users` | No | Register new user |
| `GET  /auth/me` | JWT | Current user info |
| `GET  /profiles/me` | JWT | Current user profile |
| `PUT  /profiles/me` | JWT | Update profile |
| `POST /api/incidents/analyze` | JWT | Upload CSV for analysis |
| `GET  /api/incidents/results/export` | JWT | Export last analysis as CSV |
| `GET  /suppliers` | JWT | List suppliers |
| `POST /suppliers` | JWT | Create supplier |

### 🌐 Corporate Website (Next.js — port 3000)

```bash
cd uis/website
npm run dev
```

| Route | Description |
|---|---|
| `/` | Main landing page |
| `/application` | Request form |

### 📊 Backoffice (Next.js — port 3000)

```bash
cd uis/backoffice
npm run dev
```

The backoffice uses **Next.js rewrites** (`next.config.ts`) to proxy API calls to the FastAPI backend so all requests stay same-origin from the browser:

```
/api/*       → http://localhost:8000/* (strips /api prefix)
/auth/*      → http://localhost:8000/auth/*
/users/*     → http://localhost:8000/users/*
/profiles/*  → http://localhost:8000/profiles/*
```

> 💡 The frontend uses `API_BASE = "/api"` in `lib/constants.ts`, so all fetch calls (e.g. `fetch("/api/suppliers")`) are proxied to the backend without the `/api` prefix.

| Route | Auth | Description |
|---|---|---|
| `/login` | No | Login form |
| `/register` | No | Registration form |
| `/` | JWT | Dashboard with inventory, shipments & carriers |
| `/suppliers` | JWT | Supplier directory CRUD |
| `/incidents` | JWT | CSV incident analyzer |
| `/account/profile` | JWT | User profile settings |

### 🎯 Talent Pipeline Tracker (Next.js — port 3002)

```bash
cd uis/talent-pipeline-tracker
npm run dev
```

Uses a built-in Next.js Route Handler proxy (`/api/auth-proxy/*`) to avoid CORS between ports.

| Route | Auth | Description |
|---|---|---|
| `/login` | No | Login form |
| `/register` | No | Registration form |
| `/` | JWT | Candidate list |
| `/candidates/[id]` | JWT | Candidate detail |
| `/account/profile` | JWT | User profile |

---

## How to open in Codespaces

Each service is available at a unique HTTPS URL:

| Service | Port | Codespaces URL pattern |
|---|---|---|
| FastAPI Backend | 8000 | `https://<codespace-name>-8000.app.github.dev` |
| Website | 3000 | `https://<codespace-name>-3000.app.github.dev` |
| Backoffice | 3001 | `https://<codespace-name>-3001.app.github.dev` |
| Talent Pipeline | 3002 | `https://<codespace-name>-3002.app.github.dev` |

> 💡 In the VS Code **Ports** tab you can see the exact public URLs and change port visibility from *Private* to *Public* if needed.
> ⚠️ The backoffice uses port 3000 by default. If port 3000 is already occupied by the website, Next.js will auto-assign port 3001.

---

## Key conventions

- **Zero duplication**: All shared logic lives in `src/` (`@trackflow/core`). UIs import from there, never copy code.
- **npm workspaces**: Root `npm install` installs deps for all workspaces at once.
- **Path aliases**: Each UI has `@trackflow/core` → `../../src` in `tsconfig.json`.
- **transpilePackages**: Each `next.config.ts` includes `transpilePackages: ["@trackflow/core"]` for server-side bundling.

---

## Milestones (reference)

| Milestone | Focus        | Typical deliverables                        |
| --------- | ------------ | ------------------------------------------- |
| 0         | Prework      | Environment setup, first prompts            |
| 1         | Web          | Corporate website, forms, SEO               |
| 2         | Programming  | Business logic, scoring, calculations       |
| 3         | AI-driven UI | AI-generated interfaces                     |
| 4         | Next.js      | Portals, loyalty app, operations UI         |
| 5         | Backend      | Central API (locations, menus, sales, etc.) |
| 6         | Telemetry    | Data pipeline, dashboards                   |
| 7         | RAG & Memory | Semantic knowledge base, search             |
| 8         | Agents       | Support, onboarding, training agents        |
| 9         | Workflows    | n8n automations                             |
| 10        | Real-time    | Live dashboards, alerts, streaming          |

---

## Links

- [4Geeks Academy — AI Engineering](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)
- [How to start a coding project](https://4geeks.com/lesson/how-to-start-a-project)

---

## Contributors

This template was built as part of the 4Geeks Academy AI Engineering Career Program by [@marcogonzalo](https://www.linkedin.com/in/marcogonzalo) and [@alezanchezr](https://x.com/alesanchezr) and many other contributors. Find out more about our [AI Engineering Course](https://4geeksacademy.com/en/career-programs/ai-engineering), and [other courses](https://4geeksacademy.com/en/program-comparison).

You can find other templates and resources like this at the [4Geeks Academy GitHub page](https://github.com/4geeksacademy).

_This template is maintained by 4Geeks Academy for the AI Engineering track. For exclusive use in the programme._
