-- Hito 9, Parte 2: estados de respuesta y evaluación automática.
-- Aplicar sobre la base PostgreSQL/Supabase que ya ejecutó 002_create_rfp_intake.sql.

ALTER TABLE rfp_tickets
    DROP CONSTRAINT IF EXISTS ck_rfp_tickets_part1_status;
ALTER TABLE rfp_tickets
    DROP CONSTRAINT IF EXISTS ck_rfp_tickets_status;
ALTER TABLE rfp_tickets
    ADD CONSTRAINT ck_rfp_tickets_status
    CHECK (status IN (
        'analizando', 'descartado', 'analisis_completo',
        'generando_borrador', 'en_evaluación', 'needs_human_review'
    ));

ALTER TABLE rfp_department_sections
    ADD COLUMN IF NOT EXISTS draft_content TEXT,
    ADD COLUMN IF NOT EXISTS evaluation_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS needs_human_review BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS generation_iterations INTEGER NOT NULL DEFAULT 0
        CHECK (generation_iterations >= 0);
