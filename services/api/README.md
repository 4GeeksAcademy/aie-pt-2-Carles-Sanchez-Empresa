# TrackFlow API

Unified FastAPI backend. Includes:
- **Incident Analyzer** — Analyze shipping incidents from CSV files
- **Supplier Directory** — Full CRUD with TinyDB persistence

---

## Requirements

- Python 3.10+
- `uv` (Python project manager)

```bash
# Install uv if you don't have it
pip install uv
```

---

## Getting started — step by step

### 1. Install dependencies

```bash
cd services/api
uv sync
```

This creates a virtual environment (`.venv/`) and installs FastAPI, TinyDB, Uvicorn and all other dependencies.

### 2. Seed the supplier database

```bash
uv run seed
```

Inserts 15 sample suppliers (9 from USA, 6 from Spain) into `suppliers_db.json`.
It is **idempotent**: if data already exists, it shows a warning and does not duplicate.

### 3. Start the server

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Open in the browser

[http://localhost:8000](http://localhost:8000)

---

## Endpoints

### Incident Analyzer

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/incidents/analyze` | Upload CSV with incidents (multipart/form-data) |
| `GET` | `/api/incidents/results/export` | Download last analysis as CSV |

### Supplier Directory

| Method | Path | Description | Codes |
|---|---|---|---|
| `POST` | `/api/suppliers` | Create a new supplier | `201` / `422` |
| `GET` | `/api/suppliers` | List suppliers (filters: `?country=USA&category=carrier_last_mile`) | `200` |
| `GET` | `/api/suppliers/{id}` | Get supplier by ID (TinyDB doc_id) | `200` / `404` |
| `PATCH` | `/api/suppliers/{id}/rate` | Update a supplier's rate | `200` / `404` / `422` |
| `PATCH` | `/api/suppliers/{id}/status` | Change status (active ↔ suspended) | `200` / `404` / `422` |
| `DELETE` | `/api/suppliers/{id}` | Delete a supplier | `200` / `404` |

### Frontend

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Backoffice home page |
| `GET` | `/incidents.html` | Incident analysis page |
| `GET` | `/suppliers.html` | Supplier directory page |

---

## Test the API with curl

```bash
# Health check
curl -s http://localhost:8000/api/health | python3 -m json.tool

# List all suppliers
curl -s http://localhost:8000/api/suppliers | python3 -m json.tool

# Filter by country
curl -s "http://localhost:8000/api/suppliers?country=Spain" | python3 -m json.tool

# Filter by category
curl -s "http://localhost:8000/api/suppliers?category=carrier_last_mile" | python3 -m json.tool

# Create a supplier
curl -s -X POST http://localhost:8000/api/suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Carrier",
    "country": "Spain",
    "categories": ["carrier_last_mile"],
    "rate_per_shipment": 5.50,
    "currency": "EUR",
    "service_zone": "Madrid",
    "contact_email": "info@newcarrier.es"
  }' | python3 -m json.tool

# Analyze incidents
curl -s -X POST http://localhost:8000/api/incidents/analyze \
  -F "file=@tests/sample.csv" | python3 -m json.tool

# Export incident results
curl -s http://localhost:8000/api/incidents/results/export
```

---

## Architecture

This service follows the **Hexagonal Architecture (Ports & Adapters)** principles documented in [`docs/ARCHITECTURE_PROPOSAL.md`](../../docs/ARCHITECTURE_PROPOSAL.md).

- **`analyzer/_core.py`** — Pure domain logic (validation, metrics, CSV generation). Does not depend on FastAPI or HTTP.
- **`database.py`** — Persistence layer with TinyDB.
- **`models.py`** — Pydantic models with cross-validations (country↔currency, categories, etc.).
- **`routes/suppliers.py`** — HTTP input adapter for the supplier directory.
- **`main.py`** — Main HTTP input adapter (FastAPI). Mounts all routers and serves the frontend.
- **`seed.py`** — Initial sample data loader.
- **`tests/`** — Test data for manual verification with `curl`.

---

## Validation rules (incident analyzer)

1. **Missing or invalid country** — must be `US` or `ES`
2. **Missing or invalid carrier for the country** — per `CARRIERS_BY_COUNTRY`
3. **Missing tracking number or < 8 characters**
4. **Missing or invalid category** — must be one of `VALID_CATEGORIES`
5. **Missing or invalid status** — must be `OPEN`, `CLOSED` or `DISCARDED`
6. **Missing or malformed email**
7. **Score out of range** — must be 1-5 if present
8. **Description too short** — minimum 10 characters

---

## Supplier directory rules

- **Valid categories**: `carrier_last_mile`, `carrier_international`, `warehouse_supplies`, `packaging_materials`, `reverse_logistics`, `fleet_maintenance`, `it_and_wms_software`, `cleaning_and_facilities`
- **Valid countries**: `USA`, `Spain`
- **Currencies**: USA → `USD`, Spain → `EUR`
- **Statuses**: `active`, `suspended`
- **Cross-validation**: country↔currency pair must match