import { env } from "../config/env";
import { redisClient } from "./redis";

const key = (sessionId: string) => `revoked_session:${sessionId}`;

export const denyAccessForSessions = async (
  sessionIds: string[],
): Promise<void> => {
  if (sessionIds.length === 0) {
    return;
  }

  const pipeline = redisClient.pipeline();
  for (const sessionId of sessionIds) {
    pipeline.setex(key(sessionId), env.jwtExpiresInSeconds, "1");
  }

  await pipeline.exec();
};

export const isAccessDenied = async (sessionId: string): Promise<boolean> => {
  return (await redisClient.exists(key(sessionId))) === 1;
};
