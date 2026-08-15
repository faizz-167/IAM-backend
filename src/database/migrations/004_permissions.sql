-- 004_permissions.sql

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(255) NOT NULL CHECK (
        resource IN ('ORGANIZATION', 'ROLE', 'MEMBERSHIP', 'USER', 'INVITATION', 'SESSION', 'AUDIT')
    ),
    action VARCHAR(255) NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE')),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);