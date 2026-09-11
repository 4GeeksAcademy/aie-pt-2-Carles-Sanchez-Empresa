# ─────────────────────────────────────────────────────────────
# Dockerfile — Contenedor de interfaces (website + backoffice)
# Basado en Node.js Alpine para imagen ligera
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# ─── Instalar dependencias ─────────────────────────────────

# Copiar los package.json y lockfiles necesarios
COPY package.json ./package.json
COPY src/package.json ./src/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY uis/website/package.json ./uis/website/package.json
COPY uis/backoffice/package.json ./uis/backoffice/package.json

# Instalar dependencias (sin dev para producción, pero como usamos
# --include=dev las instalamos todas porque necesitamos next dev)
RUN npm install --include=dev

# ─── Copiar código fuente ──────────────────────────────────

# Compartido (types, utils)
COPY src/ ./src/
COPY packages/shared/ ./packages/shared/

# Aplicaciones Next.js
COPY uis/website/ ./uis/website/
COPY uis/backoffice/ ./uis/backoffice/

# ─── Exponer puertos ───────────────────────────────────────
# 3000 = website, 3001 = backoffice
EXPOSE 3000 3001

# ─── Script de arranque ────────────────────────────────────
COPY uis/start.sh ./start.sh
RUN chmod +x ./start.sh

CMD ["./start.sh"]