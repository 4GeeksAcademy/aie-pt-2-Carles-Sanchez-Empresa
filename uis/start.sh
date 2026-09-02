#!/bin/sh
# ─────────────────────────────────────────────────────────────
# start.sh — Arranca website (puerto 3000) y backoffice (puerto 3001)
# Ambos procesos se ejecutan en segundo plano.
# ─────────────────────────────────────────────────────────────

set -e

echo "🚀 Arrancando TrackFlow website en el puerto 3000..."
cd /app/uis/website
npx next dev --port 3000 &

echo "🚀 Arrancando TrackFlow backoffice en el puerto 3001..."
cd /app/uis/backoffice
npx next dev --port 3001 &

# Esperar a que ambos procesos terminen (o mantener el contenedor vivo)
echo "✅ Ambos frontends iniciados. Esperando..."
wait