import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { Database } from "./types";
import { env } from "../config/env";
import { logger } from "../lib/logger";

const connectionString = env.databaseUrl;

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    }),
  }),
  log(event) {
    if (event.level === "error") {
      logger.error(
        { err: event.error, query: event.query.sql },
        "Query failed",
      );
    }
    if (event.level === "query" && env.logQueries === "true") {
      logger.info({ query: event.query.sql, params: event.query.parameters });
    }
  },
});

export async function disconnectDatabase(): Promise<void> {
  await db.destroy();
}
