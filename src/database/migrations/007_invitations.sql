-- 007_invitations.sql

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REVOKED')
    ),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS invitations_token_hash_unique_idx
    ON invitations (token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS invitations_pending_unique_idx
    ON invitations (organization_id, email) WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS invitations_email_idx ON invitations (email);
CREATE INDEX IF NOT EXISTS invitations_role_id_idx ON invitations (role_id);