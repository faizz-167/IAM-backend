import { sql } from "kysely";
import { db } from "../../database";
import {
  ACCOUNT_LOCKOUT_MINUTES,
  MAX_FAILED_LOGIN_ATTEMPTS,
} from "../../constants";

export const recordSuccessfulLogin = async (userId: string): Promise<void> => {
  await db
    .updateTable("users")
    .set({ last_login_at: new Date().toISOString() })
    .where("id", "=", userId)
    .execute();

  await db
    .updateTable("user_credentials")
    .set({ failed_login_attempts: 0, locked_until: null })
    .where("user_id", "=", userId)
    .execute();
};

/**
 * Records one failed login.
 *
 * Login rejects a live lock before it ever verifies the password, so reaching
 * here means `locked_until` is either NULL or already in the past. A non-NULL
 * value therefore marks a lock that has served its time: the counter restarts
 * at 1 instead of staying pinned at the threshold, which would otherwise make
 * every later mistake re-lock the account immediately and forever.
 */
export const updateLoginAttempt = async (userId: string): Promise<void> => {
  const nextAttempts = sql<number>`CASE WHEN locked_until IS NOT NULL THEN 1 ELSE failed_login_attempts + 1 END`;

  await db
    .updateTable("user_credentials")
    .set({
      failed_login_attempts: nextAttempts,
      locked_until: sql`CASE WHEN ${nextAttempts} >= ${MAX_FAILED_LOGIN_ATTEMPTS} THEN NOW() + make_interval(mins => ${ACCOUNT_LOCKOUT_MINUTES}) ELSE NULL END`,
    })
    .where("user_id", "=", userId)
    .execute();
};

export const updateEmailVerificationStatus = async (
  userId: string,
): Promise<void> => {
  await db
    .updateTable("user_emails")
    .set({ is_verified: true })
    .where("user_id", "=", userId)
    .where("is_primary", "=", true)
    .execute();
};

export const updateUserStatus = async (
  userId: string,
  status: "ACTIVE" | "LOCKED" | "SUSPENDED",
) => {
  await db
    .updateTable("users")
    .set({ status })
    .where("id", "=", userId)
    .execute();
};
