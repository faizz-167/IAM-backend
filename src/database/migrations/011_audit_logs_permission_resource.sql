-- 011_audit_logs_permission_resource.sql

-- Super admins can create and delete permissions, and those changes need an
-- audit row like every other mutation.
ALTER TABLE audit_logs
    DROP CONSTRAINT IF EXISTS audit_logs_resource_check;

ALTER TABLE audit_logs
    ADD CONSTRAINT audit_logs_resource_check
    CHECK (resource IN ('ORGANIZATION', 'ROLE', 'PERMISSION', 'MEMBERSHIP', 'USER', 'INVITATION', 'SESSION', 'AUDIT'));

-- The cross-organization admin view sorts every row by time.
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at);
