# Carpeta `scripts`

Esta carpeta contiene **scripts auxiliares** del monorepo: automatizaciones de desarrollo, utilidades de mantenimiento, tareas repetitivas (setup, lint, migraciones, generación de datos, etc.) y tooling interno.

- **Propósito principal**: agrupar herramientas de soporte que no pertenecen a una app/agente/pipeline específico, pero facilitan el trabajo del equipo.
- **Recomendación**: documenta cada script (qué hace, parámetros, requisitos, ejemplos de uso) y procura que sean reproducibles (y seguros) en distintos entornos.

## Proceso nocturno de telemetría

`nightly_export.py` exporta el día anterior en UTC, registra la máquina de estados
`job_runs` y lanza el pipeline como proceso independiente. Admite `TARGET_DATE=YYYY-MM-DD`
para pruebas. La especificación completa, la migración y el cron están documentados
en [`docs/NIGHTLY_EXPORT.md`](../docs/NIGHTLY_EXPORT.md).
