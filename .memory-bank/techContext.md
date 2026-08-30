# Contexto Técnico — TrackFlow

## Stack Tecnológico

### Frontend — Talent Pipeline Tracker (Next.js)

| Tecnología | Versión | Propósito |
|---|---|---|
| **Next.js** | 16.3.0 | Framework React con App Router (enrutamiento basado en sistema de archivos) |
| **React** | 19.2.8 | Biblioteca de interfaz de usuario |
| **TypeScript** | ^5 | Tipado estático para todo el código de la aplicación |
| **Tailwind CSS** | ^4 | Framework CSS utilitario (vía `@tailwindcss/postcss`) |
| **PostCSS** | — | Procesador de estilos (configurado con plugin de Tailwind) |
| **ESLint** | ^9 | Análisis estático de código (configuración `eslint-config-next` con `core-web-vitals` y `typescript`) |
| **next/image** | — | Optimización de imágenes nativa de Next.js |
| **next/link + next/navigation** | — | Navegación SPA sin recargas completas de página |

### Lógica de negocio — Módulo `src/` (TypeScript)

| Tecnología | Versión | Propósito |
|---|---|---|
| **TypeScript** | ^7.0.2 | Tipado y lógica de dominio (colecciones, búsqueda, transformaciones, validaciones) |

### Paquete compartido — `packages/shared/`

| Tecnología | Propósito |
|---|---|
| **TypeScript** | Tipos base compartidos (`Id`, `BaseEntity`) para uso transversal entre proyectos |

### Website corporativo — `uis/website/` (React + Vite)

| Tecnología | Versión | Propósito |
|---|---|---|
| **React** | ^19.2.0 | Biblioteca de interfaz de usuario |
| **TypeScript** | ^5.9.2 | Tipado estático |
| **Vite** | ^7.1.3 | Bundler y servidor de desarrollo |
| **Tailwind CSS** | ^3.4.17 | Framework CSS utilitario (Tailwind v3 con PostCSS) |
| **React Router DOM** | ^7.9.1 | Ruteo SPA entre landing y formulario |
| **PostCSS + Autoprefixer** | — | Procesamiento de estilos |

### Backoffice operacional — `uis/backoffice/` (HTML estático + bundle desde `src` + páginas servidas por FastAPI)

| Tecnología | Versión | Propósito |
|---|---|---|
| **HTML5 + Tailwind CDN** | — | Render del panel manual del backoffice (`index.html`, `incidents.html`, `suppliers.html`) |
| **JavaScript vanilla** | — | Lógica del Analizador de Incidencias (`js/incidents.js`) con drag & drop, llamadas fetch a la API |
| **TypeScript** | ^7.0.2 | Fuente única de lógica y handlers reutilizados desde `src/` para el panel de utilidades |
| **esbuild** | ^0.28.1 | Bundling de navegador en un único archivo `js/app.js` |

### Backend API — `services/api/` (FastAPI + TinyDB + JWT Auth)

| Tecnología | Versión | Propósito |
|---|---|---|
| **Python** | ^3.12 | Lenguaje de ejecución del backend |
| **FastAPI** | ^0.104.0 | Framework web asíncrono con OpenAPI automático |
| **Uvicorn** | ^0.24.0 | Servidor ASGI para FastAPI |
| **TinyDB** | ^4.8.0 | Base de datos documental ligera (JSON) para Directorio de Proveedores, Usuarios y Perfiles |
| **Pydantic v2** | — | Validación de datos con `field_validator`, `model_validator` y Enums |
| **python-multipart** | ^0.0.6 | Soporte para subida de archivos (CSV de incidencias) |
| **python-jose[cryptography]** | ^3.5.0 | Firma y verificación de tokens JWT (algoritmo HS256) |
| **libpass[bcrypt]** | ^1.9.3 | Hashing de contraseñas con bcrypt (fork drop-in de passlib, import como `from passlib.hash import bcrypt`) |
| **python-dotenv** | ^1.2.2 | Carga de variables de entorno desde `.env` (SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES) |
| **uv** | — | Gestor de proyectos Python (alternativa a pip/poetry) |

### Paquete compartido Python — `packages/shared-py/`

| Tecnología | Propósito |
|---|---|
| **Python 3.10+** | Lenguaje de ejecución |
| **Pydantic v2** | Enums con `str, Enum` para estados, categorías, orígenes y sedes |
| **trackflow-shared** | Paquete instalable vía `file://` path: centraliza enums, validación de transiciones y transformación CSV-legacy para evitar duplicación entre servicios |

### Estructura del Monorepo

```
aie-pt-2-Carles-Sanchez-Empresa/
├── src/                    # Lógica de dominio (TypeScript)
│   ├── types/models.ts     # Interfaces de dominio (Product, Shipment, Carrier…)
│   └── utils/              # Colecciones, búsqueda, transformaciones, validaciones
├── packages/shared/        # Tipos compartidos (@repo/shared-types)
├── uis/                    # Interfaces de usuario
│   ├── talent-pipeline-tracker/  # Next.js App Router
│   ├── backoffice/         # HTML estático con bundle generado desde src/
│   └── website/            # React + Vite (landing corporativa y formulario)
├── services/               # Backend: API unificada (FastAPI)
│   └── api/                #   analyzer/ (incidencias), routes/ (suppliers, users, profiles, auth), auth.py, services.py, models.py, database.py, main.py, .env
├── agents/                 # Agentes de IA (estructura preparada)
├── workflows/              # Automatizaciones y workflows (estructura preparada)
├── skills/                 # Habilidades: code-review, data-analysis, research
├── scripts/                # Scripts auxiliares
├── infra/                  # Infraestructura
├── mcps/                   # MCPs
├── data/                   # Datos
├── docs/                   # Documentación
├── internal/               # Documentación interna
└── media/                  # Recursos multimedia (logos, imágenes)
```

---

## Decisiones de Arquitectura

### 1. Monorepo con separación por dominios

Se ha optado por una estructura de monorepo donde cada área funcional tiene su propia carpeta raíz (`src/`, `uis/`, `services/`, `agents/`, `workflows/`, etc.). Esto permite:

- Desarrollo independiente de cada módulo.
- Tipos compartidos centralizados en `packages/shared/`.
- Visibilidad clara de la arquitectura general del proyecto.

### 2. Next.js con App Router para la UI principal

- **App Router** (enrutamiento basado en sistema de archivos con carpetas `app/`).
- **Rutas dinámicas**: `app/candidates/[id]/page.tsx` para el detalle de cada candidatura.
- **Navegación SPA**: uso de `next/link` y `next/navigation` (`useRouter`, `useSearchParams`) para transiciones sin recarga completa.
- **Estados de UI obligatorios**: toda operación asíncrona implementa los tres estados — carga (`LoadingSpinner`), éxito (renderizado de datos) y error (`ErrorMessage`).

### 3. Proxy API para evitar CORS

Configurado en `next.config.ts` mediante `async rewrites()`:

```typescript
source: "/api/proxy/:path*",
destination: "https://playground.4geeks.com/tracker/api/v1/:path*",
```

Todas las llamadas a la API externa se realizan a través de `/api/proxy/`, evitando problemas de CORS y manteniendo la URL base centralizada en `lib/constants.ts`.

### 3.1 Proxy de autenticación para Next.js (same-origin)

- El tracker incorpora un Route Handler interno en `app/api/auth-proxy/[...path]/route.ts`.
- Este proxy enruta llamadas de autenticación/perfil a FastAPI (`/auth/*`, `/users`, `/profiles/me`) desde el mismo origen del frontend.
- Objetivo: evitar errores de CORS en Codespaces cuando el navegador está en `-3000` y la API en `-8000`.

### 4. Estado local con hooks (sin librerías externas)

- No se usan **Redux, Zustand, Jotai** ni ninguna otra biblioteca de gestión de estado.
- El estado se gestiona exclusivamente con hooks de React (`useState`, `useEffect`, `useCallback`) a nivel de componente.
- No hay _prop drilling_; cada componente consume sus propios datos mediante llamadas a la API.

### 4.1 Guard de autenticación en cliente (Tracker)

- La protección de rutas en `uis/talent-pipeline-tracker` se hace en cliente con `components/AuthGuard.tsx` aplicado desde `app/layout.tsx`.
- El guard valida el token JWT en `localStorage` (`trackflow_token`) y redirige a `/login` si falta o está expirado.
- `login` y `register` redirigen al listado si ya existe sesión válida.

### 5. Paleta de colores personalizada (sin Tailwind theme extend)

El diseño utiliza colores fijos directamente en las clases de Tailwind (no se extiende el archivo de configuración). Paleta definida:

| Variable | Color | Uso |
|---|---|---|
| `#c6dced` | Azul claro | Fondo general |
| `#2f4a62` | Azul oscuro | Texto principal |
| `#f3ddba` | Beige / dorado claro | Fondos de header, footer, modales |
| `#c89d66` | Dorado | Bordes y acentos |
| `#14263a` | Azul petróleo | Títulos y botones principales |
| `#1d4f7a` | Azul medio | Hover de botones |
| `#f8fbff` | Blanco azulado | Input fields |

### 6. Mobile-first responsive

- Diseño adaptable con `md:` breakpoints.
- Navegación inferior fija en móvil (`md:hidden`).
- Layout flexible con `flex-col` en móvil y `flex-row` en escritorio.

### 7. Capa de servicio desacoplada

Todas las llamadas a la API están centralizadas en `services/api.ts`, que expone funciones asíncronas tipadas (`getRecords`, `createRecord`, `updateRecord`, `patchRecord`, `deleteRecord`, `getNotes`, `createNote`, `deleteNote`). El _helper_ interno `request<T>()` unifica la gestión de errores y el tipado de respuestas.

### 8. Mapeo de valores API a etiquetas

Los valores crudos de la API (ej. `received`, `in_progress`) se mapean a etiquetas legibles en español mediante archivos `lib/constants.ts`. Esto evita que términos técnicos aparezcan en la interfaz de usuario.

### 9. Backoffice con fuente única y bundle de navegador

- La lógica de negocio del backoffice no se mantiene en `uis/backoffice/` como fuente independiente.
- `src/` es la única fuente de verdad para tipos, utilidades, datos de ejemplo y handlers de UI.
- `uis/backoffice/` solo contiene:
  - `index.html` para el render estático
  - `package.json` con scripts de build/watch
  - `js/app.js` como artefacto final consumido por el navegador
- El build del backoffice se realiza bundlando `../../src/ui/handlers.ts` con `esbuild`, evitando árboles duplicados de salida por módulo.
- `src/tsconfig.json` usa `noEmit` para separar claramente validación TypeScript y salida de navegador.

### 10. Gestor de Incidencias — Paquete compartido Python (`packages/shared-py/`)

- Los enums, validaciones y transformaciones CSV de incidencias se centralizan en `trackflow-shared`, un paquete Python instalable localmente.
- Esto evita la duplicación de lógica entre el analyzer legacy, la API REST y futuros servicios.
- El submódulo `trackflow_shared.legacy` contiene el código migrado del analyzer original (`_core.py`), que ahora importa desde allí sin duplicar constantes ni funciones.
- La validación de transiciones de estado (`open → in_progress → resolved/discarded`) es estricta y se aplica tanto en Pydantic (tipos) como en `validate_incident_record()` (reglas de negocio).

---

## Restricciones Técnicas

### API externa (playground.4geeks.com)

- **URL base**: `https://playground.4geeks.com/tracker/api/v1/`
- **Proxy local**: `/api/proxy/`
- **No modificar ni adaptar la API**: el frontend debe consumirla tal cual está.
- **Autenticación**: no requiere autenticación explícita (API pública del playground).
- **Endpoints consumidos**:
  - `GET /records` — listado paginado de candidaturas
  - `GET /records/:id` — detalle de candidatura
  - `POST /records` — crear candidatura
  - `PUT /records/:id` — actualizar candidatura completa
  - `PATCH /records/:id` — actualización parcial (estado/etapa)
  - `DELETE /records/:id` — eliminar candidatura
  - `GET /records/:id/notes` — notas de una candidatura
  - `POST /records/:id/notes` — crear nota
  - `DELETE /records/:id/notes/:note_id` — eliminar nota

### Backend FastAPI — API Unificada (`services/api/`)

- **Framework**: FastAPI (desde ^0.104.0) con Uvicorn
- **Puerto**: 8000 (sirve tanto API como frontend estático)
- **Versión API**: `2.0.0`
- **Endpoints — Incident Analyzer**:
  - `POST /api/incidents/analyze` — subida CSV, devuelve JSON con validación y métricas
  - `GET /api/incidents/results/export` — descarga del último análisis como CSV
  - `GET /api/health` — health check
- **Endpoints — Supplier Directory** (router `/suppliers`):
  - `POST /suppliers` — crear proveedor (201, validación Pydantic estricta)
  - `GET /suppliers` — listar proveedores con filtros opcionales `?country=` y `?category=`
  - `GET /suppliers/{id}` — obtener proveedor por ID (404 si no existe)
  - `PATCH /suppliers/{id}/rate` — actualizar tarifa (422 si ≤ 0)
  - `PATCH /suppliers/{id}/status` — actualizar estado (active/suspended)
  - `DELETE /suppliers/{id}` — eliminar proveedor
- **Endpoints — Frontend** (servido desde FastAPI):
  - `GET /` — sirve `index.html` del backoffice (panel de utilidades)
  - `GET /login` — login del backoffice
  - `GET /register` — registro del backoffice
  - `GET /account/profile` — perfil de cuenta del usuario autenticado
  - `GET /incidents.html` — sirve la página de análisis de incidencias
  - `GET /suppliers.html` — sirve la página del directorio de proveedores
  - `GET /js/*` — sirve los archivos JavaScript del backoffice
  - Alias legacy mantenidos: `/login.html`, `/register.html`, `/profile.html`
- **Módulos**:
  - `analyzer/_core.py` — 8 reglas de validación, métricas y exportación CSV para incidencias
  - `routes/suppliers.py` — CRUD completo del directorio de proveedores
  - `models.py` — Modelos Pydantic con `SupplierCreate`, `SupplierResponse`, `SupplierUpdateRate`, `SupplierUpdateStatus`, validaciones cruzadas país↔moneda, categorías, estado (Enum)
  - `seed.py` — Poblado inicial con 15 proveedores (9 USA + 6 Spain), idempotente
- **Base de datos**: TinyDB 4.8+ — persistencia en JSON (`suppliers_db.json`), tabla `suppliers`, consultas con `tinydb.Query`

### Sistema de Inventario — Supabase + SQLModel

- **Base de datos cloud**: PostgreSQL vía Supabase, conectada mediante `sqlmodel.create_engine(SUPABASE_URL)`
- **Variable de entorno**: `SUPABASE_URL` en `.env` — si no está configurada, el backend lanza `RuntimeError` al arrancar
- **ORM**: SQLModel 0.42+ (combina SQLAlchemy + Pydantic) — modelos con `table=True` para mapeo automático
- **Sesión**: `get_db()` como dependencia FastAPI que produce `Session(engine)` por petición, cerrada automáticamente al finalizar
- **Tablas** (creadas automáticamente por SQLModel):
  - `skus` — productos con sku_code único e indexado
  - `stock_entries` — recepciones, FK→skus con CASCADE
  - `stock_exits` — despachos/pérdidas, FK→skus con CASCADE
- **Modelos ORM** (`services/api/models.py`): `SKU`, `StockEntry`, `StockExit` — todos con `Optional[int] id` como PK y `created_at: str` en ISO 8601
- **Schemas Pydantic** (`services/api/schemas.py`): separados de modelos ORM, con validaciones:
  - Categorías: fashion, electronics, cosmetics
  - Almacenes: LA (Los Ángeles), ZGZ (Zaragoza)
  - Tipos de salida: dispatch (envío), loss (pérdida)
  - tracking_number obligatorio si dispatch, nulo si loss

### Endpoints de Inventario

Router `/inventory` (protegido con JWT):

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/inventory/products` | Lista SKUs con stock calculado, filtros ?warehouse= & ?category= |
| GET | `/inventory/products/{id}` | Detalle SKU + stock actual |
| POST | `/inventory/products` | Crear SKU (201), verifica sku_code único |
| POST | `/inventory/orders/inbound` | Recepción (201), valida warehouse coincidente |
| POST | `/inventory/orders/outbound` | Despacho/pérdida (201), valida stock suficiente |
| GET | `/inventory/orders` | Todos los movimientos con datos del SKU |

### Arquitectura de Datos (Dual DB)

| Propósito | Base de Datos | Tecnología |
|-----------|---------------|------------|
| Auth (usuarios, perfiles) | Local JSON | TinyDB 4.8 |
| Proveedores | Local JSON | TinyDB 4.8 |
| Incidencias | Local JSON | TinyDB 4.8 |
| **Inventario (SKUs, movimientos)** | **Cloud PostgreSQL** | **SQLModel + Supabase** |

### Seed

```bash
# Inventario (crea 6 SKUs + 6 entradas + 4 salidas, idempotente)
cd services/api && python ../../scripts/seed_inventory.py

# Incidencias (desde CSV, idempotente)
cd services/api && python ../../scripts/seed_incidents.py

# Proveedores (15 registros, idempotente)
cd services/api && uv run seed
```

### Deuda Técnica

- **N+1 en `list_orders`**: `GET /inventory/orders` ejecuta `db.get(SKU, ...)` por cada movimiento. Solución: cargar todos los SKU relacionados en una única consulta anticipada.

**CORS**: configurado con `allow_origins=["*"]`, `allow_credentials=False`
- **Ejecución**: `uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload` (o con `uvicorn` directamente)
- **Instalación**: `uv sync` en `services/api/`
- **Seed**: `uv run seed` (idempotente, no duplica si ya hay datos)
- **Frontend**: HTML + Tailwind CDN + JavaScript vanilla (`incidents.js`), servido desde FastAPI (mismo origen, sin CORS ni Mixed Content)
- **Store en memoria**: variable global `_last_result` para la exportación CSV de incidencias

### Arquitectura Hexagonal (documentada en `docs/ARCHITECTURE_PROPOSAL.md`)

- **Elección**: Arquitectura Hexagonal (Ports & Adapters) sobre MVC y Capas
- **Motivación**: TrackFlow requiere múltiples integraciones externas (8 transportistas, 2 WMS, ERP) que deben ser intercambiables sin afectar el dominio
- **Organización propuesta**: `services/` con subcarpetas por servicio, cada una con `domain/`, `application/`, `adapters/` y `tests/`
- **FastAPI como adaptador de entrada**: no contiene reglas de negocio, solo recibe peticiones y delega en casos de uso
- **Fases de implementación**: (1) Última Milla, (2) Logística Inversa, (3) Operaciones de Almacén, (4) Atención al Cliente / Dirección

### TypeScript estricto

- `tsconfig.json` tiene `"strict": true` habilitado.
- Obligatorio tipar todas las funciones, componentes y hooks.
- No se permite `any` implícito.

### Sin librerías de estado externas

- Prohibido usar Redux, Zustand, Jotai, MobX, etc.
- Solo hooks nativos de React.

### Sin recargas de página completas

- La navegación entre listado y detalle debe ser SPA, usando el sistema de rutas de Next.js App Router.
- `useSearchParams` para filtros por query parameters sin recargar.

### Validación de formularios

- Validación manual (sin librerías externas como Formik o React Hook Form).
- Teléfono: entre 7 y 15 dígitos (expresión regular en `lib/validation.ts`).
- Campos obligatorios: nombre completo, email, teléfono, puesto.

### Estados de UI obligatorios

Toda operación de obtención de datos debe contemplar tres estados visuales:

1. **Cargando**: mostrar `LoadingSpinner`.
2. **Éxito**: mostrar los datos.
3. **Error**: mostrar `ErrorMessage` con el mensaje del error.

### Actualización optimista tras escrituras

Tras un `POST`, `PUT`, `PATCH` o `DELETE`, la interfaz debe reflejar los cambios sin requerir recarga manual ni navegación adicional.

### Organización de carpetas (Talent Pipeline Tracker)

```
uis/talent-pipeline-tracker/
├── app/
│   ├── layout.tsx          # Layout raíz (Header + Footer)
│   ├── login/page.tsx      # Login
│   ├── register/page.tsx   # Registro
│   ├── account/profile/page.tsx # Gestión de perfil
│   ├── api/auth-proxy/[...path]/route.ts # Proxy same-origin para auth/perfil
│   ├── page.tsx            # Listado de candidaturas
│   └── candidates/[id]/page.tsx  # Detalle de candidatura
├── components/             # Componentes reutilizables
│   ├── Header.tsx
│   ├── AuthGuard.tsx
│   ├── StatusBadge.tsx
│   ├── StageBadge.tsx
│   ├── LoadingSpinner.tsx
│   ├── ErrorMessage.tsx
│   └── SuccessToast.tsx
├── lib/                    # Constantes, validaciones, helpers
│   ├── constants.ts
│   └── validation.ts
├── services/               # Capa de API
│   ├── api.ts
│   └── auth.ts
└── types/                  # Tipos TypeScript
    └── index.ts
```

---

## Dependencias del Proyecto

### Talent Pipeline Tracker (`uis/talent-pipeline-tracker/`)

```json
{
  "dependencies": {
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.3.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### Lógica de dominio (`src/`)

```json
{
  "scripts": {
    "build": "npx tsc -p tsconfig.json --noEmit",
    "typecheck": "npx tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "typescript": "^7.0.2"
  }
}
```

### Backoffice (`uis/backoffice/`)

```json
{
  "scripts": {
    "build": "esbuild ../../src/ui/handlers.ts --bundle --platform=browser --format=iife --target=es2020 --outfile=./js/app.js",
    "build:watch": "esbuild ../../src/ui/handlers.ts --bundle --platform=browser --format=iife --target=es2020 --outfile=./js/app.js --watch"
  },
  "devDependencies": {
    "esbuild": "^0.28.1"
  }
}
```

### Paquete compartido (`packages/shared/`)

- `@repo/shared-types` v0.0.1 (privado, sin dependencias externas)