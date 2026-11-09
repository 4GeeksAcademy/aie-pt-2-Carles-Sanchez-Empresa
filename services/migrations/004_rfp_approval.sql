-- Parte 3: aprobación humana, checkpoint lógico independiente y propuesta final.
-- Aplicar después de 003_rfp_response_generation.sql.

ALTER TABLE rfp_tickets
    DROP CONSTRAINT IF EXISTS ck_rfp_tickets_part1_status;
-- Convert rows created by pre-Part-3 deployments before applying the new
-- status constraint, so existing tickets do not make this migration fail.
UPDATE rfp_tickets SET status = 'waiting_for_approval' WHERE status = 'esperando_aprobación';
UPDATE rfp_tickets SET status = 'done' WHERE status = 'terminado';
ALTER TABLE rfp_tickets
    DROP CONSTRAINT IF EXISTS ck_rfp_tickets_status;
ALTER TABLE rfp_tickets
    ADD CONSTRAINT ck_rfp_tickets_status CHECK (status IN (
        'analizando', 'descartado', 'archived', 'returned_to_client', 'analisis_completo', 'generando_borrador',
        'en_evaluación', 'needs_human_review', 'waiting_for_approval', 'done'
    ));
ALTER TABLE rfp_tickets
    ADD COLUMN IF NOT EXISTS final_proposal TEXT,
    ADD COLUMN IF NOT EXISTS final_proposal_created_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS final_document_path TEXT,
    ADD COLUMN IF NOT EXISTS human_review_comment TEXT,
    ADD COLUMN IF NOT EXISTS human_reviewed_by TEXT,
    ADD COLUMN IF NOT EXISTS human_reviewed_at TIMESTAMPTZ;

ALTER TABLE rfp_department_sections
    ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (approval_status IN ('pending', 'approved', 'rejected', 'changes_requested')),
    ADD COLUMN IF NOT EXISTS approver_name TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS approval_comment TEXT,
    ADD COLUMN IF NOT EXISTS approval_iteration INTEGER NOT NULL DEFAULT 0
        CHECK (approval_iteration >= 0),
    ADD COLUMN IF NOT EXISTS checkpoint_thread_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS approval_request_id TEXT;

CREATE TABLE IF NOT EXISTS rfp_approval_traces (
    id BIGSERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES rfp_tickets(ticket_id) ON DELETE CASCADE,
    department_id TEXT CHECK (department_id IS NULL OR department_id IN ('warehouse', 'lastmile', 'reverse')),
    node_name TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_rfp_approval_traces_ticket_created
    ON rfp_approval_traces (ticket_id, created_at);

CREATE TABLE IF NOT EXISTS rfp_node_traces (
    id BIGSERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES rfp_tickets(ticket_id) ON DELETE CASCADE,
    department_id TEXT CHECK (department_id IS NULL OR department_id IN ('warehouse', 'lastmile', 'reverse')),
    node_name TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_rfp_node_traces_ticket_id ON rfp_node_traces (ticket_id);
CREATE INDEX IF NOT EXISTS ix_rfp_node_traces_ticket_created
    ON rfp_node_traces (ticket_id, created_at);
