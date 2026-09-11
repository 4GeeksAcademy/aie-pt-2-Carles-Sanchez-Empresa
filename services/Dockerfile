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
COPY services/api/ ./api/

# ─── Variable de entorno por defecto ───────────────────────
ENV PYTHONPATH=/app/api

# ─── Exponer puerto ────────────────────────────────────────
EXPOSE 8000

# ─── Arrancar Uvicorn con recarga en caliente ──────────────
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--app-dir", "/app/api"]