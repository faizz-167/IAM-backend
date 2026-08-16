import { sql } from "kysely";
import { DatabaseError } from "pg";
import { db } from "../../database";
import { ConflictError, InternalServerError } from "../../errors/RequestError";
import {
  ACCOUNT_LOCKOUT_MINUTES,
  MAX_FAILED_LOGIN_ATTEMPTS,
} from "../../constants";
import { UserWithCredentials } from "../users/user.types";

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

export const updateLoginAttempt = async (userId: string): Promise<void> => {
  await db
    .updateTable("user_credentials")
    .set({
      failed_login_attempts: sql`failed_login_attempts + 1`,
      locked_until: sql`CASE WHEN failed_login_attempts + 1 >= ${MAX_FAILED_LOGIN_ATTEMPTS} THEN NOW() + make_interval(mins => ${ACCOUNT_LOCKOUT_MINUTES}) ELSE locked_until END`,
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
