# TrackFlow API

Backend FastAPI unificado. Incluye:
- **Analizador de incidencias** de envíos a partir de archivos CSV
- **Directorio de proveedores** con CRUD completo y persistencia en TinyDB

---

## Requisitos

- Python 3.10+
- `uv` (gestor de proyectos Python)

```bash
# Instalar uv si no lo tienes
pip install uv
```

---

## Puesta en marcha — paso a paso

### 1. Instalar dependencias

```bash
cd services/api
uv sync
```

Esto crea un entorno virtual (`.venv/`) e instala FastAPI, TinyDB, Uvicorn y demás dependencias.

### 2. Sembrar la base de datos de proveedores

```bash
uv run seed
```

Inserta 15 proveedores de ejemplo (9 de USA, 6 de España) en `suppliers_db.json`.
Es **idempotente**: si ya hay datos, muestra un aviso y no duplica.

### 3. Iniciar el servidor

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Abrir en el navegador

[http://localhost:8000](http://localhost:8000)

---

## Endpoints

### Analizador de incidencias

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/incidents/analyze` | Subir CSV con incidencias (multipart/form-data) |
| `GET` | `/api/incidents/results/export` | Descargar último análisis como CSV |

### Directorio de proveedores

| Método | Ruta | Descripción | Códigos |
|---|---|---|---|
| `POST` | `/api/suppliers` | Crear un nuevo proveedor | `201` / `422` |
| `GET` | `/api/suppliers` | Listar proveedores (filtros: `?country=USA&category=carrier_last_mile`) | `200` |
| `GET` | `/api/suppliers/{id}` | Obtener un proveedor por ID (doc_id de TinyDB) | `200` / `404` |
| `PATCH` | `/api/suppliers/{id}/rate` | Actualizar tarifa de un proveedor | `200` / `404` / `422` |
| `PATCH` | `/api/suppliers/{id}/status` | Cambiar estado (active ↔ suspended) | `200` / `404` / `422` |
| `DELETE` | `/api/suppliers/{id}` | Eliminar un proveedor | `200` / `404` |

### Frontend

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Página principal del backoffice |
| `GET` | `/incidents.html` | Página de análisis de incidencias |
| `GET` | `/suppliers.html` | Página del directorio de proveedores |

---

## Probar la API con curl

```bash
# Health check
curl -s http://localhost:8000/api/health | python3 -m json.tool

# Listar proveedores
curl -s http://localhost:8000/api/suppliers | python3 -m json.tool

# Filtrar por país
curl -s "http://localhost:8000/api/suppliers?country=Spain" | python3 -m json.tool

# Filtrar por categoría
curl -s "http://localhost:8000/api/suppliers?category=carrier_last_mile" | python3 -m json.tool

# Crear un proveedor
curl -s -X POST http://localhost:8000/api/suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nuevo Carrier",
    "country": "Spain",
    "categories": ["carrier_last_mile"],
    "rate_per_shipment": 5.50,
    "currency": "EUR",
    "service_zone": "Madrid",
    "contact_email": "info@nuevocarrier.es"
  }' | python3 -m json.tool

# Análisis de incidencias
curl -s -X POST http://localhost:8000/api/incidents/analyze \
  -F "file=@tests/sample.csv" | python3 -m json.tool

# Exportar resultados de incidencias
curl -s http://localhost:8000/api/incidents/results/export
```

---

## Arquitectura

Este servicio sigue los principios de **Arquitectura Hexagonal (Ports & Adapters)** documentados en [`docs/ARCHITECTURE_PROPOSAL.md`](../../docs/ARCHITECTURE_PROPOSAL.md).

- **`analyzer/_core.py`** — Lógica de dominio pura (validación, métricas, generación CSV). No depende de FastAPI ni de HTTP.
- **`database.py`** — Capa de persistencia con TinyDB.
- **`models.py`** — Modelos Pydantic con validaciones cruzadas (país↔moneda, categorías, etc.).
- **`routes/suppliers.py`** — Adaptador de entrada HTTP para el directorio de proveedores.
- **`main.py`** — Adaptador de entrada HTTP principal (FastAPI). Monta todos los routers y sirve el frontend.
- **`seed.py`** — Carga inicial de datos de ejemplo.
- **`tests/`** — Datos de prueba para verificación manual con `curl`.

---

## Reglas de validación (analizador de incidencias)

1. **País faltante o inválido** — debe ser `US` o `ES`
2. **Carrier faltante o inválido para el país** — según `CARRIERS_BY_COUNTRY`
3. **Tracking number faltante o < 8 caracteres**
4. **Categoría faltante o inválida** — debe ser una de `VALID_CATEGORIES`
5. **Estado faltante o inválido** — debe ser `OPEN`, `CLOSED` o `DISCARDED`
6. **Email faltante o con formato incorrecto**
7. **Puntuación fuera de rango** — debe ser 1-5 si está presente
8. **Descripción demasiado corta** — mínimo 10 caracteres

---

## Reglas del directorio de proveedores

- **Categorías válidas**: `carrier_last_mile`, `carrier_international`, `warehouse_supplies`, `packaging_materials`, `reverse_logistics`, `fleet_maintenance`, `it_and_wms_software`, `cleaning_and_facilities`
- **Países válidos**: `USA`, `Spain`
- **Monedas**: USA → `USD`, Spain → `EUR`
- **Estados**: `active`, `suspended`
- **Validación cruzada**: el par país↔moneda debe coincidir