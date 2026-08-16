import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { disconnectRedis, redisClient } from "./lib/redis";

async function main() {
  const app = createApp();

  await redisClient.ping();
  app.listen(env.port, () => {
    logger.info(
      `Server is running on port http://localhost:${env.port} in ${env.nodeEnv} mode`,
    );
  });
}

main().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully...`);
  await Promise.allSettled([disconnectRedis()]);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
