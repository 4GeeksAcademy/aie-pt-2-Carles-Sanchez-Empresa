# TrackFlow Incident Analyzer API

Backend FastAPI para el análisis de incidencias de envíos a partir de archivos CSV.

## Arquitectura

Este servicio sigue los principios de **Arquitectura Hexagonal (Ports & Adapters)** documentados en [`docs/ARCHITECTURE_PROPOSAL.md`](../../docs/ARCHITECTURE_PROPOSAL.md).

- **`analyzer/_core.py`** — Lógica de dominio pura (validación, métricas, generación CSV). No depende de FastAPI ni de HTTP.
- **`main.py`** — Adaptador de entrada HTTP (FastAPI). Recibe peticiones, delega en el dominio, devuelve respuestas.
- **`tests/`** — Datos de prueba para verificación manual con `curl`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/incidents/analyze` | Subir CSV con incidencias (multipart/form-data) |
| `GET` | `/api/incidents/results/export` | Descargar último análisis como CSV |
| `GET` | `/` | Página principal del backoffice |
| `GET` | `/incidents.html` | Página de análisis de incidencias |

## Cómo ejecutar

```bash
cd services/api
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Abrir en el navegador: `http://localhost:8000`

## Probar con curl

```bash
# Análisis
curl -s -X POST http://localhost:8000/api/incidents/analyze \
  -F "file=@tests/sample.csv" | python3 -m json.tool

# Exportar resultados
curl -s http://localhost:8000/api/incidents/results/export
```

## Reglas de validación (8 reglas)

1. **País faltante o inválido** — debe ser `US` o `ES`
2. **Carrier faltante o inválido para el país** — según `CARRIERS_BY_COUNTRY`
3. **Tracking number faltante o < 8 caracteres**
4. **Categoría faltante o inválida** — debe ser una de `VALID_CATEGORIES`
5. **Estado faltante o inválido** — debe ser `OPEN`, `CLOSED` o `DISCARDED`
6. **Email faltante o con formato incorrecto**
7. **Puntuación fuera de rango** — debe ser 1-5 si está presente
8. **Descripción demasiado corta** — mínimo 10 caracteres