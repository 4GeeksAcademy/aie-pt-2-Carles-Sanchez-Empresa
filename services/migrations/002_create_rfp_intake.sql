-- Hito 9, Parte 1: recepción y análisis de RFPs.
-- Aplicar en PostgreSQL/Supabase. Los estados de negocio se limitan a esta parte;
-- errores técnicos/reintentos son columnas operativas separadas.

CREATE TABLE IF NOT EXISTS rfp_tickets (
    ticket_id UUID PRIMARY KEY,
    rfp_id UUID NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'analizando'
        CHECK (status IN ('analizando', 'descartado', 'analisis_completo')),
    raw_pdf_path TEXT NOT NULL,
    markdown_path TEXT,
    created_by_user_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    celery_task_id TEXT UNIQUE,
    retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    last_error TEXT,
    failed_at TIMESTAMPTZ,
    handoff_schema_version TEXT,
    handoff_payload JSONB
);
CREATE INDEX IF NOT EXISTS ix_rfp_tickets_status ON rfp_tickets (status);
CREATE INDEX IF NOT EXISTS ix_rfp_tickets_status_created_at ON rfp_tickets (status, created_at);
CREATE INDEX IF NOT EXISTS ix_rfp_tickets_created_by_user_id ON rfp_tickets (created_by_user_id);

CREATE TABLE IF NOT EXISTS rfp_metadata (
    ticket_id UUID PRIMARY KEY REFERENCES rfp_tickets(ticket_id) ON DELETE CASCADE,
    client_name TEXT,
    client_country TEXT CHECK (client_country IS NULL OR client_country IN ('US', 'Spain')),
    services_requested JSONB NOT NULL DEFAULT '[]'::jsonb,
    monthly_volume INTEGER CHECK (monthly_volume IS NULL OR monthly_volume >= 0),
    deadline TEXT,
    budget_range TEXT,
    departments_needed JSONB NOT NULL DEFAULT '[]'::jsonb,
    unassigned_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
    currency TEXT CHECK (currency IS NULL OR currency IN ('USD', 'EUR')),
    readability_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_rfp BOOLEAN,
    classification_reason TEXT,
    classification_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    manual_review_required BOOLEAN NOT NULL DEFAULT FALSE,
    manual_review_reason TEXT,
    open_questions JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS ix_rfp_metadata_client_country ON rfp_metadata (client_country);

CREATE TABLE IF NOT EXISTS rfp_department_sections (
    id BIGSERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES rfp_tickets(ticket_id) ON DELETE CASCADE,
    department_id TEXT NOT NULL CHECK (department_id IN ('warehouse', 'lastmile', 'reverse')),
    owner TEXT NOT NULL,
    relevant_extracts JSONB NOT NULL DEFAULT '[]'::jsonb,
    key_aspects JSONB NOT NULL DEFAULT '[]'::jsonb,
    open_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rfp_department_section_ticket_department UNIQUE (ticket_id, department_id)
);
CREATE INDEX IF NOT EXISTS ix_rfp_department_sections_ticket ON rfp_department_sections (ticket_id);
