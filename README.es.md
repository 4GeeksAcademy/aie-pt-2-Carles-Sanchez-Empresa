# Proyecto de Compañía - Ingeniería de IA — Plantilla para estudiantes

[![4Geeks Academy](https://img.shields.io/badge/4Geeks-Academy-blue)](https://4geeksacademy.com)
[![AI Engineering](https://img.shields.io/badge/track-AI%20Engineering-green)](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)

_Plantilla base para proyectos transversales del Programa de Carrera en Ingeniería de IA — 4Geeks Academy._

_Las instrucciones están [disponibles en inglés](./README.md)._

---

## Propósito

Este repositorio es la **plantilla de inicio** para los proyectos transversales. Trabajarás con escenarios de empresas reales (Brasaland, TrackFlow, Nexova) construyendo entregables que se corresponden con los hitos del curso (Web, Programación, Backend, Telemetría, RAG, Agentes, Workflows, Tiempo real).

- Crea una plantilla a partir de este repositorio.
- Reemplaza el `CONTEXT.md` placeholder por el contexto de tu empresa asignada.
- Usa `skills/` y los `README.md` por carpeta como guía de trabajo.

---

## Estado actual de la plantilla

Actualmente el repositorio ofrece una **estructura base de carpetas y documentación**, más los siguientes **entregables implementados**:

| Entregable | Ubicación | Estado |
|---|---|---|
| **Lógica de dominio compartida** (tipos, colecciones, búsqueda, transformaciones, validaciones, auth) | `src/` (`@trackflow/core`) | ✅ Completado |
| **Backoffice** (Next.js 16 + React 19 + Tailwind v4) | `uis/backoffice/` | ✅ Completado |
| **Web corporativa** (Next.js 16 + React 19 + Tailwind v4) | `uis/website/` | ✅ Completado |
| **Talent Pipeline Tracker** (Next.js 16 + React 19 + Tailwind v4) | `uis/talent-pipeline-tracker/` | ✅ Completado |
| **Skills** — Carrier Selection Optimizer, Returns Triage Assistant | `skills/` | ✅ Completado |
| **Propuesta de arquitectura** (Hexagonal + FastAPI) | `docs/ARCHITECTURE_PROPOSAL.md` | ✅ Completado |
| **Incident Analyzer API** — Backend FastAPI para análisis CSV de incidencias | `services/api/` | ✅ Completado |

> Todos los archivos placeholder anteriores (`CONTEXT.md`, `AGENTS.md`, `company-choice.md`) han sido reemplazados con contenido específico de TrackFlow.

---

## Estructura del repositorio

```text
ai-engineering-company-project-monorepo/
├── README.md
├── README.es.md
├── CONTEXT.md
├── AGENTS.md
├── company-choice.md
├── package.json              # npm workspaces root (monorepo)
├── agents/                   # Patrones/plantillas de agentes y documentación de tools
├── data/                     # raw, process, pipelines, eval
├── docs/                     # Documentación de proyecto y arquitectura
├── infra/                    # Docker, Terraform, configuraciones de despliegue
├── internal/                 # CLIs, scripts de migración empaquetados, utilidades internas
├── mcps/                     # Servidores Model Context Protocol (MCP)
├── packages/
│   └── shared/               # Paquete compartido (@repo/shared-types)
├── scripts/                  # Convenciones/documentación de scripts
├── services/
│   └── api/                  # Backend FastAPI (auth, users, suppliers, incidents, profiles)
├── shared/                   # Recursos/convenciones compartidas a nivel repo
├── skills/                   # Skills reutilizables para agentes
├── src/                      # @trackflow/core — lógica TS compartida usada por todas las UIs
├── uis/
│   ├── backoffice/           # App Next.js 16 (puerto 3001)
│   ├── website/              # App Next.js 16 (puerto 3000)
│   └── talent-pipeline-tracker/  # App Next.js 16 (puerto 3002)
└── workflows/                # Documentación de automatizaciones/orquestación
```

### Monorepo con npm workspaces

El `package.json` raíz define los workspaces:

```
["src", "packages/shared", "uis/website", "uis/backoffice", "uis/talent-pipeline-tracker"]
```

Todas las UIs comparten lógica desde `src/` mediante el paquete `@trackflow/core` (exports desde `src/index.ts`), usando alias de ruta (`@trackflow/core` → `../../src`) y `transpilePackages` en Next.js. Sin duplicación de código.

---

## Cómo empezar

1. **Usa este repositorio como plantilla** y crea tu propio repo de proyecto.
2. **Clona** tu repositorio (o ábrelo en Codespaces).
3. **Reemplaza** `CONTEXT.md` con el contexto completo de tu empresa asignada.
4. **Revisa** los `README.md` de cada carpeta raíz para entender responsabilidades (`uis/`, `services/`, `data/`, `skills/`, etc.).
5. **Empieza a implementar** entregables por hito en `uis/` y `services/`, reutilizando `packages/shared/` y `data/` según corresponda.

---

## Cómo ejecutar el proyecto (monorepo)

Este monorepo usa **npm workspaces**. Todas las UIs Next.js comparten lógica de dominio desde `src/` (`@trackflow/core`).  
Cada servicio corre en un puerto diferente para poder coexistir localmente o en Codespaces.

### Requisitos previos

```bash
# Desde la raíz del repositorio, instalar dependencias de todos los workspaces
npm install
```

### 🖥️ Backend FastAPI (puerto 8000)

```bash
cd services/api
uv sync                    # instalar deps de Python
source venv/bin/activate   # activar entorno virtual
uv run seed                # opcional: datos de ejemplo de proveedores
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

> ⚠️ Ejecuta `uvicorn` **dentro** del venv (`source venv/bin/activate` primero), o usa `uv run uvicorn main:app ...` como alternativa.

Endpoints de la API:

| Endpoint | Auth | Descripción |
|---|---|---|
| `GET  /api/health` | No | Health check |
| `POST /auth/login` | No | Login (email + password → JWT) |
| `POST /users` | No | Registrar nuevo usuario |
| `GET  /auth/me` | JWT | Info del usuario actual |
| `GET  /profiles/me` | JWT | Perfil del usuario actual |
| `PUT  /profiles/me` | JWT | Actualizar perfil |
| `POST /api/incidents/analyze` | JWT | Subir CSV para análisis |
| `GET  /api/incidents/results/export` | JWT | Exportar último CSV |
| `GET  /suppliers` | JWT | Listar proveedores |
| `POST /suppliers` | JWT | Crear proveedor |

### 🌐 Web Corporativa (Next.js — puerto 3000)

```bash
cd uis/website
npm run dev
```

| Ruta | Descripción |
|---|---|
| `/` | Landing principal |
| `/application` | Formulario de solicitud |

### 📊 Backoffice (Next.js — puerto 3000)

```bash
cd uis/backoffice
npm run dev
```

El backoffice usa **rewrites de Next.js** (`next.config.ts`) para redirigir las llamadas API al backend FastAPI, manteniendo todo en el mismo origen:

```
/api/*       → http://localhost:8000/* (elimina el prefijo /api)
/auth/*      → http://localhost:8000/auth/*
/users/*     → http://localhost:8000/users/*
/profiles/*  → http://localhost:8000/profiles/*
```

> 💡 El frontend usa `API_BASE = "/api"` en `lib/constants.ts`, por lo que todas las llamadas fetch (ej. `fetch("/api/suppliers")`) se redirigen al backend sin el prefijo `/api`.

| Ruta | Auth | Descripción |
|---|---|---|
| `/login` | No | Formulario de login |
| `/register` | No | Formulario de registro |
| `/` | JWT | Dashboard con inventario, envíos y carriers |
| `/suppliers` | JWT | CRUD de proveedores |
| `/incidents` | JWT | Analizador CSV de incidencias |
| `/account/profile` | JWT | Ajustes de perfil de usuario |

### 🎯 Talent Pipeline Tracker (Next.js — puerto 3002)

```bash
cd uis/talent-pipeline-tracker
npm run dev
```

Usa un proxy interno de Next.js Route Handler (`/api/auth-proxy/*`) para evitar CORS entre puertos.

| Ruta | Auth | Descripción |
|---|---|---|
| `/login` | No | Formulario de login |
| `/register` | No | Formulario de registro |
| `/` | JWT | Lista de candidatos |
| `/candidates/[id]` | JWT | Detalle de candidato |
| `/account/profile` | JWT | Perfil de usuario |

---

## Cómo abrir en Codespaces

Cada servicio está disponible en una URL HTTPS única:

| Servicio | Puerto | Patrón de URL en Codespaces |
|---|---|---|
| Backend FastAPI | 8000 | `https://<codespace>-8000.app.github.dev` |
| Website | 3000 | `https://<codespace>-3000.app.github.dev` |
| Backoffice | 3000 | `https://<codespace>-3001.app.github.dev` |
| Talent Pipeline | 3002 | `https://<codespace>-3002.app.github.dev` |

> 💡 En la pestaña **Ports** de VS Code puedes ver las URLs públicas exactas y cambiar la visibilidad de *Privado* a *Público* si es necesario.
> ⚠️ El backoffice usa el puerto 3000 por defecto. Si el website ya ocupa el 3000, Next.js asignará automáticamente el puerto 3001.

---

## Convenciones clave

- **Duplicación cero**: Toda la lógica compartida vive en `src/` (`@trackflow/core`). Las UIs importan de ahí, nunca copian código.
- **npm workspaces**: `npm install` desde la raíz instala deps de todos los workspaces a la vez.
- **Path aliases**: Cada UI tiene `@trackflow/core` → `../../src` en su `tsconfig.json`.
- **transpilePackages**: Cada `next.config.ts` incluye `transpilePackages: ["@trackflow/core"]` para el bundle del servidor.

---

## Hitos (referencia)

| Hito | Enfoque       | Entregables típicos                              |
| ---- | ------------- | ------------------------------------------------ |
| 0    | Prework       | Configuración del entorno, primeros prompts      |
| 1    | Web           | Sitio corporativo, formularios, SEO              |
| 2    | Programación  | Lógica de negocio, puntuación, cálculos          |
| 3    | UI con IA     | Interfaces generadas con IA                      |
| 4    | Next.js       | Portales, app de fidelización, UI de operaciones |
| 5    | Backend       | API central (ubicaciones, menús, ventas, etc.)   |
| 6    | Telemetría    | Pipeline de datos, dashboards                    |
| 7    | RAG y memoria | Base de conocimiento semántica, búsqueda         |
| 8    | Agentes       | Agentes de soporte, onboarding, formación        |
| 9    | Workflows     | Automatizaciones con n8n                         |
| 10   | Tiempo real   | Dashboards en vivo, alertas, streaming           |

---

## Enlaces

- [4Geeks Academy — Ingeniería de IA](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia)
- [Cómo empezar un proyecto de código](https://4geeks.com/lesson/how-to-start-a-project)

---

## Contribuidores

Esta plantilla fue creada como parte del Programa de Carrera de Ingeniería de IA de 4Geeks Academy por [@marcogonzalo](https://www.linkedin.com/in/marcogonzalo) y [@alezanchezr](https://x.com/alesanchezr), junto a otros muchos colaboradores. Descubre más sobre nuestro [Curso de Ingeniería de IA](https://4geeksacademy.com/es/programas-de-carrera/ingenieria-ia) y sobre [otros cursos](https://4geeksacademy.com/es/comparar-programas).

Puedes encontrar otras plantillas y recursos similares en la [página de GitHub de 4Geeks Academy](https://github.com/4geeksacademy).

_Esta plantilla la mantiene 4Geeks Academy para el track de Ingeniería de IA. Uso exclusivo del programa._
