-- 000_extension_and_helpers.sql

-- gen_random_uuid() is built in from PostgreSQL 13; pgcrypto supplies it on
-- older servers and is a no-op on newer ones.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
