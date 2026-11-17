#!/bin/sh
# ─────────────────────────────────────────────────────────────
# start.sh — Arranca website (puerto 3000) y backoffice (puerto 3001)
# Usa next start (servidor de producción con assets minificados).
# ─────────────────────────────────────────────────────────────

set -e

echo "🚀 Arrancando TrackFlow website en el puerto 3000..."
cd /app/uis/website
npx next start --port 3000 &

echo "🚀 Arrancando TrackFlow backoffice en el puerto 3001..."
cd /app/uis/backoffice
npx next start --port 3001 &

echo "🚀 Arrancando TrackFlow Talent Pipeline en el puerto 3002..."
cd /app/uis/talent-pipeline-tracker
npx next start --port 3002 &

# Esperar a que los tres procesos terminen (o mantener el contenedor vivo)
echo "✅ Los tres frontends iniciados. Esperando..."
wait