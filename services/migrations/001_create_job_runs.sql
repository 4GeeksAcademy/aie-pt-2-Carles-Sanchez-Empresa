-- DEV-53: control de ejecuciones nocturnas.
-- Ejecutar contra la misma base PostgreSQL que contiene telemetry_events.

CREATE TABLE IF NOT EXISTS job_runs (
    id BIGSERIAL PRIMARY KEY,
    job_name TEXT NOT NULL,
    target_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_job_runs_job_name_target_date
    ON job_runs (job_name, target_date);

-- El lock se adquiere atómicamente: solo una ejecución por job puede estar
-- processing en cualquier instante.
CREATE UNIQUE INDEX IF NOT EXISTS ux_job_runs_processing_job
    ON job_runs (job_name)
    WHERE status = 'processing';
