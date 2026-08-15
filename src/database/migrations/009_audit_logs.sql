-- 009_audit_logs.sql

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL CHECK (
        resource IN ('ORGANIZATION', 'ROLE', 'MEMBERSHIP', 'USER', 'INVITATION', 'SESSION', 'AUDIT')
    ),
    target_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_organization_id_created_at_idx
    ON audit_logs (organization_id, created_at);

CREATE INDEX IF NOT EXISTS audit_logs_actor_user_id_idx ON audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS audit_logs_target_id_idx ON audit_logs (target_id);