-- Completa el esquema de generación de respuestas RFP sin alterar estados ni datos.
-- Algunos entornos aplicaron la migración 004 sin haber aplicado 003. La API
-- actual lee estas columnas incluso para tickets que aún están en análisis.
-- Las adiciones IF NOT EXISTS permiten ejecutar esta reparación más de una vez.

ALTER TABLE rfp_department_sections
    ADD COLUMN IF NOT EXISTS draft_content TEXT,
    ADD COLUMN IF NOT EXISTS evaluation_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS needs_human_review BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS generation_iterations INTEGER NOT NULL DEFAULT 0;
