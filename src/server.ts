import type { Server } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { disconnectDatabase } from "./database";
import { logger } from "./lib/logger";
import { disconnectRedis, redisClient } from "./lib/redis";

let server: Server | undefined;
let shuttingDown = false;

async function main() {
  const app = createApp();

  await redisClient.ping();

  server = app.listen(env.port, () => {
    logger.info(
      `Server is running on port http://localhost:${env.port} in ${env.nodeEnv} mode`,
    );
  });
}

/**
 * Stops accepting connections, lets in-flight requests finish, then releases
 * the Redis and Postgres pools.
 *
 * A hard timeout backs this up: a hung keep-alive connection must not keep the
 * process alive past the orchestrator's own kill deadline.
 */
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  logger.info(`${signal} received, shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    logger.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, env.shutdownTimeoutMs);
  forceExit.unref();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
      });
    }

    await Promise.allSettled([disconnectRedis(), disconnectDatabase()]);
    logger.info("Shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error(error, "Error during shutdown");
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error(err, "Error starting server");
  process.exit(1);
});

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
