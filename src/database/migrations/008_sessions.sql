-- 008_sessions.sql

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    family_id UUID NOT NULL DEFAULT gen_random_uuid(),
    replaced_by UUID REFERENCES sessions(id) ON DELETE SET NULL,
    device_name VARCHAR(255),
    user_agent VARCHAR(255),
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_refresh_token_hash_unique_idx
    ON sessions (refresh_token_hash);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_family_id_idx ON sessions (family_id);