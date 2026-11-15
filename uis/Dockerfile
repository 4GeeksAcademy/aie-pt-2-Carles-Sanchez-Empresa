# ─────────────────────────────────────────────────────────────
# Dockerfile — Contenedor de interfaces (website + backoffice)
# Multi-stage: build (minificación) → producción
# Basado en Node.js Alpine para imagen ligera
# ─────────────────────────────────────────────────────────────

# ─── Stage 1: Dependencias ─────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copiar los package.json y lockfiles necesarios
COPY package.json ./package.json
COPY src/package.json ./src/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY uis/website/package.json ./uis/website/package.json
COPY uis/backoffice/package.json ./uis/backoffice/package.json
COPY uis/talent-pipeline-tracker/package.json ./uis/talent-pipeline-tracker/package.json

# Instalar dependencias (incluyendo dev para next build)
RUN npm install --include=dev

# ─── Stage 2: Build ────────────────────────────────────────
FROM deps AS builder

# Copiar código fuente
COPY src/ ./src/
COPY packages/shared/ ./packages/shared/
COPY uis/website/ ./uis/website/
COPY uis/backoffice/ ./uis/backoffice/
COPY uis/talent-pipeline-tracker/ ./uis/talent-pipeline-tracker/

# Build de producción (minifica JS con Terser y CSS con cssnano)
RUN cd uis/website && npx next build
RUN cd uis/backoffice && npx next build
RUN cd uis/talent-pipeline-tracker && npx next build

# ─── Stage 3: Producción ───────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar solo lo necesario desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/uis/website ./uis/website
COPY --from=builder /app/uis/backoffice ./uis/backoffice
COPY --from=builder /app/uis/talent-pipeline-tracker ./uis/talent-pipeline-tracker

# Script de arranque (usa next start en lugar de next dev)
COPY uis/start.sh ./start.sh
RUN chmod +x ./start.sh

# ─── Exponer puertos ───────────────────────────────────────
# 3000 = website, 3001 = backoffice, 3002 = talent pipeline
EXPOSE 3000 3001 3002

CMD ["./start.sh"]