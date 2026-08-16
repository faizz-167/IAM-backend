import { Pool } from "pg";
import { logger } from "../lib/logger";
import { env } from "../config/env";

const TABLES = [
  "audit_logs",
  "invitations",
  "memberships",
  "role_permissions",
  "permissions",
  "roles",
  "organizations",
  "sessions",
  "user_credentials",
  "user_emails",
  "users",
];

const pool = new Pool({
  connectionString: env.databaseUrl,
});

const clear = async (): Promise<void> => {
  if (env.isProduction) {
    throw new Error("Refusing to clear the database in production.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `TRUNCATE TABLE ${TABLES.join(", ")} RESTART IDENTITY CASCADE;`,
    );
    await client.query("COMMIT");
    logger.info(`Cleared tables: ${TABLES.join(", ")}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

clear()
  .catch((error) => {
    logger.error(error, "Database clear failed");
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
