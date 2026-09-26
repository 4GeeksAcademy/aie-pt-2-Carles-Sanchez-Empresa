# ─────────────────────────────────────────────────────────────
# Dockerfile — Backend FastAPI con recarga en caliente
# Basado en Python slim para imagen ligera
# ─────────────────────────────────────────────────────────────
FROM python:3.12-slim AS base

WORKDIR /app

# ─── Instalar uv (gestor de paquetes rápido) ───────────────
RUN pip install --no-cache-dir uv

# ─── Copiar dependencias ───────────────────────────────────
COPY services/api/requirements.txt ./api/requirements.txt
COPY packages/shared-py/ ./packages/shared-py/

# ─── Instalar dependencias ─────────────────────────────────
# Primero instalamos la shared-py local
RUN uv pip install --system ./packages/shared-py/
RUN uv pip install --system -r ./api/requirements.txt

# ─── Copiar código fuente ──────────────────────────────────
# Copiar el módulo de telemetría (analysis.py) a /app/telemetry/
# NOTA: No se copia a /app/services/ porque services.py en api/ lo sombrea
COPY services/telemetry/__init__.py ./telemetry/__init__.py
COPY services/telemetry/analysis.py ./telemetry/analysis.py

# Módulos de reporting y pipeline, usados por los endpoints /reporting.
COPY data/ ./data/
COPY services/reporting/ ./reporting/
COPY services/__init__.py ./services/__init__.py
COPY services/celery_app.py ./services/celery_app.py
COPY scripts/ ./scripts/

# Copiar el código de la API
COPY services/api/ ./api/
# El worker necesita los módulos históricos de la API, por ejemplo
# `from database import engine`, durante la ejecución del pipeline.
COPY services/api/database.py ./database.py
COPY services/api/models.py ./models.py
# La API se ejecuta con /app/api como directorio de imports. Este archivo
# debe copiarse después del árbol de la API para no ser sobrescrito.
COPY services/celery_app.py ./api/celery_app.py

# ─── Variable de entorno por defecto ───────────────────────
# PYTHONPATH=/app permite importar tanto `routes` como `telemetry.analysis`
ENV PYTHONPATH=/app

# ─── Exponer puerto ────────────────────────────────────────
EXPOSE 8000

# ─── Arrancar Uvicorn con recarga en caliente ──────────────
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--app-dir", "/app/api"]