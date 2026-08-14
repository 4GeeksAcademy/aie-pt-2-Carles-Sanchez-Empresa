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
| **Lógica de dominio** (tipos, colecciones, búsqueda, transformaciones, validaciones) | `src/` | ✅ Completado |
| **Panel operativo Backoffice** (HTML + TypeScript → bundle esbuild) | `uis/backoffice/` | ✅ Completado |
| **Web corporativa** (React + Vite + Tailwind) | `uis/website/` | ✅ Completado |
| **Talent Pipeline Tracker** (Next.js App Router) | `uis/talent-pipeline-tracker/` | ✅ Completado |
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
├── CONTEXT.md                # Placeholder a reemplazar con el contexto asignado
├── agents/                   # Patrones/plantillas de agentes y documentación de tools
├── data/                     # raw, process, pipelines, eval
├── docs/                     # Documentación de proyecto y arquitectura
├── infra/                    # Docker, Terraform, configuraciones de despliegue
├── internal/                 # CLIs, scripts de migración empaquetados, utilidades internas
├── mcps/                     # Servidores Model Context Protocol (MCP)
├── packages/
│   └── shared/               # Paquete compartido (@repo/shared-types)
├── scripts/                  # Convenciones/documentación de scripts
├── services/                 # APIs y workers en segundo plano
├── shared/                   # Recursos/convenciones compartidas a nivel repo
├── skills/                   # Skills reutilizables para agentes
├── uis/                      # Interfaces de usuario (React, Next.js, Streamlit, HTML)
└── workflows/                # Documentación de automatizaciones/orquestación
```

---

## Cómo empezar

1. **Usa este repositorio como plantilla** y crea tu propio repo de proyecto.
2. **Clona** tu repositorio (o ábrelo en Codespaces).
3. **Reemplaza** `CONTEXT.md` con el contexto completo de tu empresa asignada.
4. **Revisa** los `README.md` de cada carpeta raíz para entender responsabilidades (`uis/`, `services/`, `data/`, `skills/`, etc.).
5. **Empieza a implementar** entregables por hito en `uis/` y `services/`, reutilizando `packages/shared/` y `data/` según corresponda.

---

## Cómo ejecutar el proyecto

### 📊 Backoffice — Incident Analyzer (API + Frontend)

El **Analizador de Incidencias** permite subir un archivo CSV con incidencias de envíos y obtener resultados de validación y métricas. Tanto la API como el frontend se sirven desde el mismo servidor.

```bash
# Iniciar el servidor (FastAPI sirve API y frontend)
cd services/api
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- **Abrir en navegador**: `http://localhost:8000` (o la URL HTTPS de Codespaces en el puerto 8000)
- **Health check de la API**: `GET /api/health`
- **Analizar incidencias**: Haz clic en *"📊 Analizar incidencias"* del menú, sube un CSV y pulsa *Analizar*.
- **Probar con datos de ejemplo**: Usa `services/api/tests/sample.csv`

### 📦 Backoffice — Panel Operativo (HTML / esbuild)

```bash
# Build y watch (genera js/app.js desde src/ui/handlers.ts)
cd uis/backoffice
npm run watch

# En otra terminal, servir los archivos estáticos
cd uis/backoffice
python3 -m http.server 5500

# Abrir: http://localhost:5500
```

### 🌐 Web Corporativa (React + Vite)

```bash
cd uis/website
npm install
npm run dev
```

### 🎯 Talent Pipeline Tracker (Next.js)

```bash
cd uis/talent-pipeline-tracker
npm install
npm run dev
```

---

## Cómo abrir en Codespaces

Cuando se ejecuta en GitHub Codespaces, cada servicio está disponible en una URL HTTPS única según su puerto:

| Servicio | Puerto local | Patrón de URL en Codespaces |
|---|---|---|
| Incident Analyzer (API + frontend) | 8000 | `https://<codespace>-8000.app.github.dev` |
| Backoffice (estático) | 5500 | `https://<codespace>-5500.app.github.dev` |
| Website (Vite) | 5173 | `https://<codespace>-5173.app.github.dev` |
| Talent Pipeline (Next.js) | 3000 | `https://<codespace>-3000.app.github.dev` |

> 💡 Consejo: En la pestaña *Ports* de VS Code (panel inferior), puedes ver las URLs públicas exactas de cada puerto. También puedes cambiar la visibilidad de *Privado* a *Público* si es necesario.

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
