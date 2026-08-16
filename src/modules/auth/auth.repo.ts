import { sql } from "kysely";
import { DatabaseError } from "pg";
import { db } from "../../database";
import { ConflictError, InternalServerError } from "../../errors/RequestError";
import { UserWithCredentials } from "./auth.types";
import {
  ACCOUNT_LOCKOUT_MINUTES,
  MAX_FAILED_LOGIN_ATTEMPTS,
} from "../../constants";

const PG_UNIQUE_VIOLATION = "23505";

export const createUser = async (input: {
  display_name: string;
  email: string;
  password_hash: string;
}): Promise<UserWithCredentials> => {
  try {
    return await db.transaction().execute(async (trx) => {
      const user = await trx
        .insertInto("users")
        .values({ display_name: input.display_name })
        .returning(["id", "display_name", "status", "created_at", "updated_at"])
        .executeTakeFirstOrThrow();

      const email = await trx
        .insertInto("user_emails")
        .values({
          email: input.email.toLowerCase(),
          user_id: user.id,
          is_primary: true,
        })
        .returning("email")
        .executeTakeFirstOrThrow();

      const password = await trx
        .insertInto("user_credentials")
        .values({ user_id: user.id, password_hash: input.password_hash })
        .returning("password_hash")
        .executeTakeFirstOrThrow();

      return {
        id: user.id,
        display_name: user.display_name,
        email: email.email,
        status: user.status,
        password_hash: password.password_hash,
        failed_login_attempts: 0,
        locked_until: null,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    });
  } catch (error) {
    if (error instanceof DatabaseError && error.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError(
        "A User with this email already exists, please login instead",
      );
    }
    throw new InternalServerError("Failed to create user");
  }
};

export const isUserExists = async (email: string): Promise<boolean> => {
  const normalizedEmail = email.toLowerCase();
  const user = await db
    .selectFrom("user_emails")
    .where(sql`lower(email)`, "=", normalizedEmail)
    .where("is_primary", "=", true)
    .select("user_id")
    .executeTakeFirst();

  return user ? true : false;
};

export const getUserByEmail = async (
  email: string,
): Promise<UserWithCredentials | null> => {
  const normalizedEmail = email.toLowerCase();

  const result = await db
    .selectFrom("user_emails")
    .innerJoin("users", "user_emails.user_id", "users.id")
    .innerJoin("user_credentials", "users.id", "user_credentials.user_id")
    .where(sql`lower(email)`, "=", normalizedEmail)
    .where("is_primary", "=", true)
    .select([
      "users.id",
      "users.display_name",
      "user_emails.email",
      "users.status",
      "users.created_at",
      "users.updated_at",
      "user_credentials.password_hash",
      "user_credentials.failed_login_attempts",
      "user_credentials.locked_until",
    ])
    .executeTakeFirst();

  return result ?? null;
};

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

export const getUserById = async (
  userId: string,
): Promise<UserWithCredentials | null> => {
  const result = await db
    .selectFrom("users")
    .innerJoin("user_emails", "users.id", "user_emails.user_id")
    .innerJoin("user_credentials", "users.id", "user_credentials.user_id")
    .where("users.id", "=", userId)
    .select([
      "users.id",
      "users.display_name",
      "user_emails.email",
      "users.status",
      "users.created_at",
      "users.updated_at",
      "user_credentials.password_hash",
      "user_credentials.failed_login_attempts",
      "user_credentials.locked_until",
    ])
    .executeTakeFirst();

  return result ?? null;
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
