import { sql, Transaction } from "kysely";
import { Database } from "../../database/types";
import { recordAudit } from "../audit/audit.service";
import { AuditEntry } from "../audit/audit.types";
import { db } from "../../database";
import { UserAuthState, UserWithCredentials } from "./user.types";
import { ConflictError, InternalServerError } from "../../errors/RequestError";
import { DatabaseError } from "pg";
import { PG_UNIQUE_VIOLATION } from "../../constants";
import { logger } from "../../lib/logger";

const USER_WITH_CREDENTIALS_COLUMNS = [
  "users.id",
  "users.display_name",
  "user_emails.email",
  "users.status",
  "users.is_super_admin",
  "users.created_at",
  "users.updated_at",
  "user_credentials.password_hash",
  "user_credentials.failed_login_attempts",
  "user_credentials.locked_until",
] as const;

export const getUserAuthState = async (
  userId: string,
): Promise<UserAuthState | null> => {
  const result = await db
    .selectFrom("users")
    .where("id", "=", userId)
    .where("deleted_at", "is", null)
    .select(["id", "status", "is_super_admin"])
    .executeTakeFirst();

  return result ?? null;
};

export const getUserById = async (
  userId: string,
): Promise<UserWithCredentials | null> => {
  const result = await db
    .selectFrom("users")
    .innerJoin("user_emails", "users.id", "user_emails.user_id")
    .innerJoin("user_credentials", "users.id", "user_credentials.user_id")
    .where("users.id", "=", userId)
    .where("users.deleted_at", "is", null)
    .where("user_emails.is_primary", "=", true)
    .select(USER_WITH_CREDENTIALS_COLUMNS)
    .executeTakeFirst();

  return result ?? null;
};

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
        .returning([
          "id",
          "display_name",
          "status",
          "is_super_admin",
          "created_at",
          "updated_at",
        ])
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
        is_super_admin: user.is_super_admin,
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

    logger.error({ err: error }, "Failed to create user");
    throw new InternalServerError("Failed to create user");
  }
};

export const isUserExists = async (email: string): Promise<boolean> => {
  const normalizedEmail = email.toLowerCase();
  const user = await db
    .selectFrom("user_emails")
    .innerJoin("users", "users.id", "user_emails.user_id")
    .where(sql`lower(user_emails.email)`, "=", normalizedEmail)
    .where("user_emails.is_primary", "=", true)
    .where("users.deleted_at", "is", null)
    .select("user_emails.user_id")
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
    .where(sql`lower(user_emails.email)`, "=", normalizedEmail)
    .where("user_emails.is_primary", "=", true)
    .where("users.deleted_at", "is", null)
    .select(USER_WITH_CREDENTIALS_COLUMNS)
    .executeTakeFirst();

  return result ?? null;
};

export const updateDisplayName = async (
  userId: string,
  displayName: string,
): Promise<void> => {
  await db
    .updateTable("users")
    .set({ display_name: displayName })
    .where("id", "=", userId)
    .where("deleted_at", "is", null)
    .execute();
};

/** Setting a password also clears any lockout left from failed logins. */
export const updatePasswordHash = async (
  userId: string,
  passwordHash: string,
): Promise<void> => {
  await db
    .updateTable("user_credentials")
    .set({
      password_hash: passwordHash,
      failed_login_attempts: 0,
      locked_until: null,
    })
    .where("user_id", "=", userId)
    .where("type", "=", "password")
    .execute();
};

export const isOwnerOfAnyOrganization = async (
  userId: string,
  ownerRoleId: string,
): Promise<boolean> => {
  const row = await db
    .selectFrom("memberships")
    .innerJoin(
      "organizations",
      "organizations.id",
      "memberships.organization_id",
    )
    .where("memberships.user_id", "=", userId)
    .where("memberships.role_id", "=", ownerRoleId)
    .where("organizations.deleted_at", "is", null)
    .select("memberships.id")
    .executeTakeFirst();

  return row !== undefined;
};

/**
 * Locks every live super admin row and returns their ids. Callers that remove
 * super-admin power check the count under this lock, so two concurrent
 * demotions cannot both see "one other admin left" and leave none.
 */
export const lockSuperAdmins = async (
  trx: Transaction<Database>,
): Promise<string[]> => {
  const rows = await trx
    .selectFrom("users")
    .where("is_super_admin", "=", true)
    .where("deleted_at", "is", null)
    .select("id")
    .forUpdate()
    .execute();

  return rows.map((row) => row.id);
};

/**
 * Soft-deletes the user and strips everything that would let the account act
 * or be found again: memberships, credentials, email addresses (which also
 * frees the address for a new registration) and live sessions. Returns the
 * revoked session ids so their access tokens can be denylisted.
 */
export const softDeleteUser = async (
  userId: string,
  audit: AuditEntry,
): Promise<string[]> => {
  return await db.transaction().execute(async (trx) => {
    const superAdmins = await lockSuperAdmins(trx);

    if (superAdmins.includes(userId) && superAdmins.length === 1) {
      throw new ConflictError(
        "The last super admin cannot delete their account",
      );
    }

    await trx
      .updateTable("users")
      .set({ deleted_at: sql<string>`now()`, is_super_admin: false })
      .where("id", "=", userId)
      .execute();

    await trx.deleteFrom("memberships").where("user_id", "=", userId).execute();
    await trx.deleteFrom("user_emails").where("user_id", "=", userId).execute();
    await trx
      .deleteFrom("user_credentials")
      .where("user_id", "=", userId)
      .execute();

    const sessions = await trx
      .updateTable("sessions")
      .set({ revoked_at: sql<string>`now()` })
      .where("user_id", "=", userId)
      .where("revoked_at", "is", null)
      .returning("id")
      .execute();

    await recordAudit(audit, trx);

    return sessions.map((row) => row.id);
  });
};
