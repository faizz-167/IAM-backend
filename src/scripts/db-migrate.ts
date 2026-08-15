import { config } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { logger } from "../lib/logger";
import { Pool } from "pg";
import { env } from "../config/env";

type MigrationRow = {
  name: string;
};

const MIGRATION_PATH = path.join(
  process.cwd(),
  "src",
  "database",
  "migrations",
);

const pool = new Pool({
  connectionString: env.databaseUrl,
});

const CREATE_MIGRATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

const getExecutedMigrations = async (): Promise<string[]> => {
  const result = await pool.query<MigrationRow>(
    `SELECT name FROM migrations ORDER BY name;`,
  );

  return result.rows.map((row: MigrationRow) => row.name);
};

const getMigrationFiles = async (): Promise<string[]> => {
  return fs
    .readdirSync(MIGRATION_PATH)
    .filter((file) => file.endsWith(".sql"))
    .sort();
};

const runMigration = async (fileName: string): Promise<void> => {
  const sql = fs.readFileSync(path.join(MIGRATION_PATH, fileName), "utf-8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO migrations (name) VALUES ($1)", [fileName]);
    await client.query("COMMIT");
    logger.info(`Migration ${fileName} executed successfully.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const migrate = async (): Promise<void> => {
  await pool.query(CREATE_MIGRATION_TABLE_SQL);

  const executed = new Set(await getExecutedMigrations());
  const pendingMigrations = (await getMigrationFiles()).filter(
    (file) => !executed.has(file),
  );

  if (pendingMigrations.length === 0) {
    logger.info("No pending migrations.");
    return;
  }

  for (const fileName of pendingMigrations) {
    await runMigration(fileName);
  }

  logger.info("All migrations executed successfully.");
};

migrate()
  .catch((error) => {
    logger.error(error, "Migration failed");
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
