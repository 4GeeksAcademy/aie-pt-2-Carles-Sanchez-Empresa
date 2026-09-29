# DEV-53 — Proceso nocturno de telemetría

## Propósito

`scripts/nightly_export.py` es un proceso independiente de FastAPI. Para una fecha objetivo exporta `telemetry_events` a `data/raw/telemetry_YYYY-MM-DD.csv` si el snapshot todavía no existe y lanza el pipeline existente en `data/pipelines/pipeline.py` como subprocess.

El CSV es backup/auditoría. El pipeline continúa leyendo `telemetry_events` desde la base de datos; nunca consume el CSV.

## Estados y control de concurrencia

La tabla `job_runs` se crea mediante `services/migrations/001_create_job_runs.sql`. Cada intento se registra con `job_name`, `target_date` y estado:

```text
pending → processing → completed
                    ↘ failed
```

`processing` es el único lock distribuido. El índice único parcial impide dos ejecuciones activas del mismo job. Cada cancelación por lock y cada omisión por duplicado crea un intento propio y lo marca `failed`, conservando la auditoría sin ejecutar trabajo duplicado. No existe un lock adicional.

`job_runs` registra la orquestación nocturna; el pipeline mantiene sus propios registros en `reporting.pipeline_execution_log`/`pipeline_runs` cuando corresponda. Las responsabilidades no se mezclan.

## Instalación de la tabla

Ejecutar la migración contra la base PostgreSQL configurada en `SUPABASE_URL`:

```bash
psql "$SUPABASE_URL" -f services/migrations/001_create_job_runs.sql
```

El script y `services/job_runner.py` no importan FastAPI ni arrancan el servidor.

## Ejecución manual

```bash
python scripts/nightly_export.py
```

La fecha predeterminada es ayer en UTC. Para pruebas:

```bash
TARGET_DATE=2025-01-15 python scripts/nightly_export.py
```

Si ya hay una ejecución `processing`, la nueva se registra como `failed` por cancelación y termina sin ruido operativo. Si ya hay una ejecución `completed` para la misma pareja `(nightly_export, target_date)`, se registra una omisión `failed` y no se vuelve a exportar ni a lanzar el pipeline.

## Cron

Se incluye una plantilla en `infra/cron/nightly_export.cron.example`:

```cron
0 2 * * * cd /ruta/al/proyecto && /ruta/al/python scripts/nightly_export.py >> /ruta/al/proyecto/data/nightly_export.log 2>&1
```

La hora concreta es configurable; la fecha de negocio siempre se calcula en UTC. Se eligió cron porque es un proceso independiente, sencillo de auditar y no comparte el hilo ni el ciclo de vida de FastAPI. No se usa `APScheduler`, `@repeat_every` ni un hook `lifespan` de la API.

## Logs

Los eventos normales se emiten en `INFO`, los fallos en `ERROR`, y cada línea incluye timestamp, `job=nightly_export` y el estado resultante.
