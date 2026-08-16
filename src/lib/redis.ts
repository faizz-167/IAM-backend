import Redis from "ioredis";
import { env } from "../config/env";
import { MAX_RETRIES_PER_REQUEST_REDIS } from "../constants";
import { logger } from "./logger";

export const redisClient = new Redis(env.redisUrl, {
  maxRetriesPerRequest: MAX_RETRIES_PER_REQUEST_REDIS,
});

redisClient.on("error", (err: Error) => {
  logger.error(err, "Redis connection error");
});

export async function disconnectRedis(): Promise<void> {
  await redisClient.quit();
}
