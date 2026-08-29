-- 010_permission_resource_cleanup.sql

-- Databases created before 000 gained its CREATE EXTENSION line.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 'PERMISSION' was accepted by the column but has no entry in the application's
-- permission catalogue, so no PERMISSION:* row can ever be created. Drop it so
-- the constraint and the catalogue describe the same set.
ALTER TABLE permissions
    DROP CONSTRAINT IF EXISTS permissions_resource_check;

ALTER TABLE permissions
    ADD CONSTRAINT permissions_resource_check
    CHECK (resource IN ('ORGANIZATION', 'ROLE', 'MEMBERSHIP', 'AUDIT'));
