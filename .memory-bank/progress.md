# Progreso del Proyecto — TrackFlow

## ✅ Hitos Completados

### 🏢 Elección y Contexto de la Empresa
- [x] Empresa escogida: **TrackFlow** (logística de última milla y almacenes)
- [x] Documento `company-choice.md` con motivación y visión inicial
- [x] Análisis de departamentos: Operaciones, Gestión, Logística, Experiencia del Cliente, Comercial, Tecnología, Dirección Ejecutiva

### 📁 Estructura del Monorepo
- [x] Creación de la estructura base del repositorio (`src/`, `uis/`, `services/`, `agents/`, `workflows/`, `skills/`, etc.)
- [x] README.md principal y en español (`README.es.md`)
- [x] README descriptivo para cada carpeta raíz (bilingües)
- [x] Paquete compartido `@repo/shared-types` en `packages/shared/`
- [x] Archivo `CONTEXT.md` con directrices del proyecto

### 🧠 Lógica de Dominio — `src/`
- [x] Definición de interfaces y tipos del dominio (`src/types/models.ts`):
  - `Product`, `Dimensions`, `Shipment`, `Destination`, `Carrier`
  - Enums y tipos unión (`ProductCategory`, `WarehouseLocation`, `ShipmentPriority`, etc.)
- [x] Funciones de colecciones (`src/utils/collections.ts`):
  - `filterProductsByWarehouse`, `filterProductsByCategory`, `filterLowStockProducts`
  - `sortProductsByStock`, `sortCarriersByReliability`
- [x] Funciones de búsqueda (`src/utils/search.ts`):
  - `findProductBySKU`, `findShipmentById`, `binarySearchProductByWeight`
- [x] Funciones de scoring y costes (`src/utils/transformations.ts`):
  - `calculateShippingCost`, `scoreCarrierForShipment`
- [x] Validaciones de negocio (`src/utils/validations.ts`):
  - `validateProduct`, `validateShipment`, `validateCarrier`

### 🗂️ Backoffice Operacional — `uis/backoffice/`

**Fase 1 — Migración del HTML al área de UI**
- [x] Traslado del panel manual desde `src/index.html` a `uis/backoffice/index.html`
- [x] Conservación de la interfaz visual y de los resultados renderizados en pantalla (`<pre>`, estados de validación y mensajes de error/éxito)

**Fase 2 — Integración con TypeScript del monorepo**
- [x] Creación de datos de ejemplo tipados en `src/data/sampleData.ts`
- [x] Creación del entrypoint de interfaz en `src/ui/handlers.ts`
- [x] Exportación de tipos y funciones del dominio para reutilización desde la UI:
  - `src/types/models.ts`
  - `src/utils/collections.ts`
  - `src/utils/search.ts`
  - `src/utils/transformations.ts`
  - `src/utils/validations.ts`
- [x] Conexión de la interfaz del backoffice con la lógica de negocio original de `src/`, sin mantener archivos fuente duplicados en `uis/backoffice/`

**Fase 3 — Build y eliminación de duplicación**
- [x] Conversión de `src/` en fuente de verdad TypeScript con `noEmit` y `typecheck` sin generación de JS intermedio
- [x] Configuración de `uis/backoffice/package.json` con build de navegador mediante `esbuild`
- [x] Generación de un único bundle de salida en `uis/backoffice/js/app.js`
- [x] Eliminación del árbol duplicado de artefactos `js/data`, `js/types`, `js/ui` y `js/utils` en backoffice
- [x] Eliminación de sourcemaps en la salida final para evitar copias textuales adicionales del código fuente

**Fase 4 — Verificación funcional**
- [x] `npm run typecheck` correcto en `src/`
- [x] `npm run build` correcto en `uis/backoffice/`
- [x] Carga HTTP verificada del panel y del bundle (`index.html` + `js/app.js`)
- [x] El resultado de la lógica de negocio sigue siendo visible en la UI del backoffice, no solo en consola
- [x] Documentación bilingüe del backoffice (`README.md` y `README.es.md`) con instalación, build, watch y servidor estático

### 🌐 Landing Pages (HTML estático) → React Website (`uis/website/`)

**Fase 1 — HTML estático original**
- [x] Landing page principal (`index.html`) con datos estructurados Schema.org
- [x] Formulario de solicitud empresarial (`application.html`) con diseño TrackFlow
- [x] Validación JavaScript del formulario (`validation.js`):
  - Validación de campos requeridos, email, teléfono, URL
  - Selectores condicionales (producto × volumen)
  - Feedback visual de errores y éxito

**Fase 2 — Migración a React + TypeScript + Tailwind**
- [x] Migración de HTML estático a componentes React reutilizables con TypeScript y Tailwind
- [x] Proyecto Vite + React 19 + TypeScript + Tailwind en `uis/website/`
- [x] **Componentes reutilizables de layout**: `SiteHeader` (responsive desktop/móvil), `SiteFooter`
- [x] **Componentes de landing**: `StructuredData` (Schema.org JSON-LD), `SectionContainer`, `InfoCard`
- [x] **Formulario React tipado**: `ApplicationForm` con estado local, `FormField` genérico
- [x] **Tipos TypeScript del dominio** (`src/types/application.ts`): `ApplicationFormData`, `FormErrors`, tipos unión para producto, volumen, país, servicios
- [x] **Validación TypeScript** (`src/utils/applicationValidation.ts`): email, teléfono, URL, campos requeridos, advertencia producto×volumen, contador de caracteres
- [x] **Ruteo SPA**: `/` (landing) y `/application` (formulario) con React Router
- [x] **Documentación bilingüe**: `README.md` (EN) y `README.es.md` (ES) con comandos y troubleshooting
- [x] `npm run typecheck` sin errores y `npm run build` correcto

### 🎯 Talent Pipeline Tracker — Frontend Next.js
- [x] Inicialización del proyecto Next.js 16 con App Router y TypeScript
- [x] Configuración de Tailwind CSS 4 con PostCSS
- [x] Configuración de ESLint 9 con `eslint-config-next`
- [x] **Proxy API**: rewrites de Next.js para evitar CORS
- [x] **Tipos TypeScript** (`uis/talent-pipeline-tracker/types/index.ts`):
  - `RecordOut`, `RecordCreate`, `RecordUpdate`, `RecordPatch`
  - `NoteCreate`, `NoteOut`, `RecordsQuery`, `PaginatedRecords`
  - Tipos unión `StatusValue`, `StageValue` y etiquetas `StatusLabel`, `StageLabel`
- [x] **Constantes y validaciones** (`lib/`):
  - Mapeo de valores crudos a etiquetas en español
  - Validación de teléfono (7-15 dígitos)
- [x] **Componentes reutilizables**:
  - `Header.tsx` — cabecera con logo y navegación responsive
  - `StatusBadge.tsx` — etiqueta visual de estado
  - `StageBadge.tsx` — etiqueta visual de etapa
  - `LoadingSpinner.tsx` — indicador de carga
  - `ErrorMessage.tsx` — mensaje de error
  - `SuccessToast.tsx` — notificación de éxito
- [x] **Capa de servicios** (`services/api.ts`):
  - Cliente HTTP genérico `request<T>()`
  - Funciones: `getRecords`, `getRecordById`, `createRecord`, `updateRecord`, `patchRecord`, `deleteRecord`
  - Funciones de notas: `getNotes`, `createNote`, `deleteNote`
- [x] **Layout raíz** (`app/layout.tsx`): Header + Footer con paleta de colores TrackFlow
- [x] **Página de listado** (`app/page.tsx`):
  - Tabla de candidaturas con nombre, puesto, estado y etapa
  - Filtros por estado y etapa (query params con `useSearchParams`)
  - Búsqueda por nombre/email
  - Modal de nueva candidatura con validación
  - Estados: carga, éxito, error
- [x] **Página de detalle** (`app/candidates/[id]/page.tsx`):
  - Datos completos del candidato
  - Controles PATCH para cambiar estado/etapa con una interacción
  - Modal de edición de datos (PUT)
  - Listado de notas con crear/eliminar
  - Estados: carga, éxito, error

### 📝 Documentación del Proyecto
- [x] `techContext.md` en `.memory-bank/` con:
  - Stack tecnológico completo
  - 8 decisiones de arquitectura documentadas
  - Restricciones técnicas detalladas

---

### 📐 Reglas de Desarrollo — `.agents/rules/`
- [x] Creación de `typescript-strict.md` — tipado estricto, prohibición de `any`, tipado explícito en funciones y componentes
- [x] Creación de `styling-rules.md` — paleta de colores TrackFlow, mobile-first responsive, estados de UI obligatorios, Tailwind CSS

### 🤖 Skills de Agente — `skills/`
- [x] Creación de **Carrier Selection Optimizer** — selección óptima del transportista entre los 8 de la red TrackFlow evaluando coste, tiempo y fiabilidad
- [x] Creación de **Returns Triage Assistant** — clasificación automática de devoluciones con reglas de aprobación/rechazo, recogida y reacondicionamiento

### 📐 Propuesta de Arquitectura — `docs/`
- [x] Documento `ARCHITECTURE_PROPOSAL.md` con:
  - Contexto y problemas documentados de TrackFlow
  - Alternativas consideradas (MVC, Capas, Hexagonal)
  - Justificación de la elección de Arquitectura Hexagonal + FastAPI
  - Estructura de carpetas propuesta para `services/`
  - Endpoints propuestos por dominio de negocio
  - Estrategia de implementación por fases
  - Riesgos y puntos de atención

### 🚀 Backend — Incident Analyzer API (`services/api/`)

**Fase 1 — Módulo de análisis (`analyzer/`)**
- [x] Creación de `analyzer/_core.py` con:
  - Constantes: `VALID_COUNTRIES`, `CARRIERS_BY_COUNTRY`, `VALID_CATEGORIES`, `EMAIL_RE`
  - `validate_record()` — 8 reglas de validación (país, carrier, tracking, categoría, estado, email, puntuación, descripción)
  - `compute_metrics()` — métricas sobre registros válidos (categorías, estados, países, satisfacción)
  - `analyze_rows()` — orquestación de validación + métricas
  - `build_results_csv()` — exportación a CSV plano
- [x] `analyzer/__init__.py` con re-exportación pública de símbolos
- [x] Datos de prueba: `tests/sample.csv` con 7 registros (4 válidos, 3 inválidos)

**Fase 2 — Endpoints FastAPI (`main.py`)**
- [x] `POST /api/incidents/analyze` — subida CSV con validación de extensión, parseo y análisis
- [x] `GET /api/incidents/results/export` — descarga del último análisis como CSV
- [x] `GET /api/health` — health check
- [x] CORS configurado con `allow_origins=["*"]`
- [x] Manejo de errores: 400 (CSV inválido, vacío, extensión incorrecta), 404 (sin análisis previo)
- [x] Prueba verificada con `curl`

**Fase 3 — Frontend unificado (`uis/backoffice/`)**
- [x] Página `incidents.html` con drag & drop, cards de totales, tabla de reglas inválidas, métricas y botón de descarga
- [x] Lógica `js/incidents.js` con rutas relativas (mismo origen que la API)
- [x] FastAPI sirve también el frontend: `GET /` → `index.html`, `GET /incidents.html`, `GET /js/*`
- [x] Sin dependencia de servidor estático externo (todo en puerto 8000)
- [x] Sin problemas de CORS ni Mixed Content en Codespaces

**Fase 4 — Eliminación de duplicación**
- [x] `scripts/analyze.py` refactorizado: ya no duplica constantes ni lógica — importa todo del módulo compartido `services/api/analyzer/`  (validate_record, compute_metrics, analyze_rows, build_results_csv, RULE_LABELS, constantes)
- [x] `scripts/analyze.py` solo mantiene: `print_report()` (salida consola), `export_csv()` (wrapper a fichero) y `_pct()` helper local
- [x] `print_report()` ahora recibe un dict `result` de `analyze_rows()` en lugar de parámetros individuales

---

## 🔜 Próximos Pasos

*(Por definir — sección reservada para futuros hitos)*

---

## ✅ Hitos Completados (continuación)

### 🚀 Backend — API Unificada (`services/api/`)

**Fase 5 — Directorio de Proveedores (`routes/suppliers.py`, `models.py`, `database.py`)**
- [x] Creación de modelos Pydantic (`models.py`):
  - `SupplierCreate` con validación de país (USA/Spain), categorías (8 válidas), moneda (USD/EUR), tarifa (>0), estado (Enum active/suspended)
  - Validador cruzado `model_validator` país↔moneda (USA→USD, Spain→EUR)
  - `SupplierResponse` con id y updated_at, `SupplierUpdateRate`, `SupplierUpdateStatus`
- [x] Base de datos TinyDB (`database.py`): tabla `suppliers` persistida en `suppliers_db.json`
- [x] CRUD completo en `routes/suppliers.py`:
  - `POST /suppliers` — crear (201 con validación Pydantic)
  - `GET /suppliers` — listar con filtros por `?country=` y `?category=`
  - `GET /suppliers/{id}` — obtener por ID (404 si no existe)
  - `PATCH /suppliers/{id}/rate` — actualizar tarifa
  - `PATCH /suppliers/{id}/status` — actualizar estado (active/suspended)
  - `DELETE /suppliers/{id}` — eliminar
- [x] Seeder `seed.py` con 15 proveedores iniciales (9 USA, 6 Spain), idempotente
- [x] Inclusión del router en `main.py`: `app.include_router(suppliers_router)`
- [x] Nuevos endpoints frontend servidos: `GET /suppliers.html`
- [x] Dependencias: `tinydb>=4.8.0`, `python-multipart>=0.0.6`
- [x] Documentación `README.md` bilingüe con comandos uv

### 🗂️ Backoffice Operacional — `uis/backoffice/` (nuevas páginas)

**Fase 5 — Analizador de Incidencias (página dedicada)**
- [x] Nueva página `incidents.html` con:
  - Cabecera TrackFlow (gradiente azul-verde) y navegación a otras páginas
  - Zona drag & drop para subir CSV con feedback visual
  - Botón de análisis con estado disabled hasta seleccionar archivo
  - Sección de resultados con tarjetas de totales (registros, válidos, inválidos, países, transportistas)
  - Tabla de reglas inválidas con colores por tipo
  - Tarjetas de métricas (categorías, estados, satisfacción)
  - Botón de descarga CSV del resultado
  - Manejo de errores con alerta visible
- [x] Lógica `js/incidents.js` con JavaScript vanilla:
  - Drag & drop nativo + selector de archivos
  - Validación de extensión .csv
  - Llamadas fetch a `POST /api/incidents/analyze` y `GET /api/incidents/results/export`
  - Renderizado dinámico de resultados (totales, tabla, métricas)
  - Reset de estado y cambio de archivo
- [x] APIs servidas desde el mismo origen (FastAPI): sin CORS ni Mixed Content

**Fase 6 — Directorio de Proveedores (página dedicada)**
- [x] Nueva página `suppliers.html` con:
  - Filtros por país y categoría (selects)
  - Tabla de proveedores con columnas: nombre, país, categorías, tarifa, moneda, estado, acciones
  - Botones de acción: editar tarifa, cambiar estado (active/suspended), eliminar
  - Modal inline para edición de tarifa
  - Confirmación antes de eliminar
  - Feedback visual de operaciones (éxito/error)
  - Diseño responsive con Tailwind CSS CDN
- [x] Navegación entre páginas: index.html → suppliers.html → incidents.html

**Fase 7 — Panel principal actualizado (`index.html`)**
- [x] Barra de navegación superior con enlaces a Proveedores y Analizador de Incidencias
- [x] Diseño coherente con el resto de páginas (misma cabecera, paleta de colores)

### 🚀 Backend — Autenticación y Protección de Rutas AUTH-01

**Fase 8 — Autenticación JWT (`services/api/auth.py`, services, routes)**
- [x] Dependencias instaladas: `python-jose[cryptography]`, `libpass[bcrypt]`, `python-dotenv`
- [x] Archivo `.env` con `SECRET_KEY` y `ACCESS_TOKEN_EXPIRE_MINUTES`
- [x] Tablas `users` y `profiles` añadidas a TinyDB en `database.py`
- [x] **`auth.py`**: configuración JWT (HS256), hashing bcrypt, dependencias `get_current_user` y `require_admin`
- [x] **`services.py`**: capa de servicios con CRUD de usuarios y perfiles en TinyDB
- [x] **`routes/users.py`**: router `/users` con CRUD completo, control de roles (admin/manager/user mediante Enum), contraseñas hasheadas, `POST /users` crea perfil vinculado si se reciben datos opcionales
- [x] **`routes/profiles.py`**: router `/profiles` con `GET /me` y `PUT /me` (protegidos, solo dueño)
- [x] **`routes/auth.py`**: router `/auth` con `POST /login` (devuelve JWT) y `GET /me` (protegido, devuelve email + role + perfil)
- [x] **Protección de rutas existentes**: todos los endpoints de `/suppliers` protegidos vía `dependencies=[Depends(get_current_user)]`
- [x] **Protección de incidents**: `POST /api/incidents/analyze` y `GET /api/incidents/results/export` protegidos con `Depends(get_current_user)`
- [x] **Rutas públicas**: health check, login, registro (`POST /users`), frontend estático
- [x] **Control de acceso 403**: solo admin puede cambiar roles, solo admin puede listar/eliminar usuarios ajenos
- [x] **Verificación completa** (curl + Swagger /docs):
  - Registro `POST /users` → 201 con usuario + perfil (sin contraseña)
  - Login `POST /auth/login` → 200 con JWT
  - Rutas protegidas sin token → 401
  - Rutas protegidas con token válido → 200
  - Login con credenciales incorrectas → 401
  - `GET /auth/me` → 200 con email, role y perfil vinculado