import { db } from "../../database";
import { UnauthenticatedError } from "../../errors/RequestError";
import { Session } from "./session.types";

const SESSION_COLUMNS = [
  "id",
  "user_id",
  "refresh_token_hash",
  "family_id",
  "expires_at",
  "created_at",
] as const;

export const createSession = async (input: Session) => {
  return await db
    .insertInto("sessions")
    .values({
      user_id: input.user_id,
      refresh_token_hash: input.refresh_token_hash,
      expires_at: input.expires_at,
      ip_address: input.ip_address ?? null,
      user_agent: input.user_agent ?? null,
      ...(input.family_id ? { family_id: input.family_id } : {}),
    })
    .returning(SESSION_COLUMNS)
    .executeTakeFirstOrThrow();
};

/**
 * Swaps a refresh token for its successor in one transaction.
 *
 * Insert and revoke have to commit together: done as two statements, a crash in
 * between leaves a live session the client never received, or revokes the old
 * one with no replacement. The `revoked_at IS NULL` guard is what makes two
 * concurrent refreshes safe — the loser finds nothing to update and the whole
 * transaction, new session included, rolls back.
 */
export const rotateSession = async (
  currentSessionId: string,
  input: Session,
) => {
  return await db.transaction().execute(async (trx) => {
    const newSession = await trx
      .insertInto("sessions")
      .values({
        user_id: input.user_id,
        refresh_token_hash: input.refresh_token_hash,
        expires_at: input.expires_at,
        ip_address: input.ip_address ?? null,
        user_agent: input.user_agent ?? null,
        ...(input.family_id ? { family_id: input.family_id } : {}),
      })
      .returning(SESSION_COLUMNS)
      .executeTakeFirstOrThrow();

    const replaced = await trx
      .updateTable("sessions")
      .set({
        replaced_by: newSession.id,
        revoked_at: new Date().toISOString(),
      })
      .where("id", "=", currentSessionId)
      .where("revoked_at", "is", null)
      .returning("id")
      .executeTakeFirst();

    if (!replaced) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    return newSession;
  });
};

export const findSessionByTokenHash = async (tokenHash: string) => {
  return await db
    .selectFrom("sessions")
    .where("refresh_token_hash", "=", tokenHash)
    .selectAll()
    .executeTakeFirst();
};

/** Returns the ids actually revoked, so their access tokens can be denylisted. */
export const revokeSession = async (sessionId: string): Promise<string[]> => {
  const rows = await db
    .updateTable("sessions")
    .set({ revoked_at: new Date().toISOString() })
    .where("id", "=", sessionId)
    .where("revoked_at", "is", null)
    .returning("id")
    .execute();

  return rows.map((row) => row.id);
};

export const revokeSessionFamily = async (
  familyId: string,
): Promise<string[]> => {
  const rows = await db
    .updateTable("sessions")
    .set({ revoked_at: new Date().toISOString() })
    .where("family_id", "=", familyId)
    .where("revoked_at", "is", null)
    .returning("id")
    .execute();

  return rows.map((row) => row.id);
};

export const revokeAllUserSessions = async (
  userId: string,
): Promise<string[]> => {
  const rows = await db
    .updateTable("sessions")
    .set({ revoked_at: new Date().toISOString() })
    .where("user_id", "=", userId)
    .where("revoked_at", "is", null)
    .returning("id")
    .execute();

  return rows.map((row) => row.id);
};
