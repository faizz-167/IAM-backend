import { NotFoundError } from "../../errors/RequestError";
import { denyAccessForSessions } from "../../lib/accessTokenDenylist";
import { recordAudit } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/audit.types";
import * as sessionsRepo from "./sessions.repo";
import { ActiveSession } from "./session.types";

export const listMySessions = async (
  userId: string,
  currentSessionId: string,
): Promise<ActiveSession[]> => {
  return await sessionsRepo.listActiveUserSessions(userId, currentSessionId);
};

export const revokeMySession = async (
  userId: string,
  sessionId: string,
): Promise<void> => {
  const revoked = await sessionsRepo.revokeUserSession(userId, sessionId);

  // Unknown, already revoked, and someone else's all look the same.
  if (revoked.length === 0) {
    throw new NotFoundError("Session");
  }

  await denyAccessForSessions(revoked);

  await recordAudit({
    action: AUDIT_ACTIONS.SESSION_REVOKED,
    resource: "SESSION",
    actorUserId: userId,
    targetId: sessionId,
  });
};
