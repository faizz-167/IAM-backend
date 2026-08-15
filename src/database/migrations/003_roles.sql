-- 003_roles.sql

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS roles_org_name_unique_idx
    ON roles (organization_id, name) WHERE organization_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS roles_system_name_unique_idx
    ON roles (name) WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS roles_organization_id_idx ON roles (organization_id);

CREATE TRIGGER roles_set_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();