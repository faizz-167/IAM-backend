import { env } from "../config/env";
import { redisClient } from "./redis";

const key = (sessionId: string) => `revoked_session:${sessionId}`;

/**
 * Blocks the access tokens that were issued for the given sessions.
 *
 * Revoking a refresh token alone leaves its access token usable until it
 * expires, so "log out" would not actually log anyone out for up to
 * `JWT_EXPIRES_IN`. Entries expire on that same lifetime: once no live token
 * can carry the session id, the entry has nothing left to block.
 *
 * Rotation on refresh deliberately does not go through here — the client is
 * still the legitimate holder, and killing its in-flight access token would
 * fail concurrent requests for no security gain.
 */
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

/**
 * Fails closed: if Redis is unreachable the error propagates and the request is
 * rejected, rather than silently honouring a token that may have been revoked.
 */
export const isAccessDenied = async (sessionId: string): Promise<boolean> => {
  return (await redisClient.exists(key(sessionId))) === 1;
};
