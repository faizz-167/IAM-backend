import { db } from "../../database";
import { Session } from "./session.types";

export const createSession = async (input: Session) => {
  return await db
    .insertInto("sessions")
    .values({
      user_id: input.user_id,
      refresh_token_hash: input.refresh_token_hash,
      expires_at: input.expires_at,
      ip_address: input.ip_address ?? null,
      user_agent: input.user_agent ?? null,
    })
    .returning([
      "id",
      "user_id",
      "refresh_token_hash",
      "family_id",
      "expires_at",
      "created_at",
    ])
    .executeTakeFirstOrThrow();
};

export const findSessionByTokenHash = async (tokenHash: string) => {
  return await db
    .selectFrom("sessions")
    .where("refresh_token_hash", "=", tokenHash)
    .selectAll()
    .executeTakeFirst();
};

export const revokeSession = async (sessionId: string) => {
  await db
    .updateTable("sessions")
    .set({ revoked_at: new Date().toISOString() })
    .where("id", "=", sessionId)
    .where("revoked_at", "is", null)
    .execute();
};

export const revokeSessionFamily = async (familyId: string) => {
  await db
    .updateTable("sessions")
    .set({ revoked_at: new Date().toISOString() })
    .where("family_id", "=", familyId)
    .where("revoked_at", "is", null)
    .execute();
};

export const revokeAllUserSessions = async (userId: string) => {
  await db
    .updateTable("sessions")
    .set({ revoked_at: new Date().toISOString() })
    .where("user_id", "=", userId)
    .where("revoked_at", "is", null)
    .execute();
};

export const markSessionReplaced = async (
  sessionId: string,
  replacedById: string,
) => {
  await db
    .updateTable("sessions")
    .set({
      replaced_by: replacedById,
      revoked_at: new Date().toISOString(),
    })
    .where("id", "=", sessionId)
    .execute();
};
