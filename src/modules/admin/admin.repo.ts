import { sql } from "kysely";
import { db } from "../../database";
import { ConflictError } from "../../errors/RequestError";
import { paginate, Paginated, PaginationQuery } from "../../lib/pagination";
import { recordAudit } from "../audit/audit.service";
import { AuditEntry } from "../audit/audit.types";
import { lockSuperAdmins } from "../users/user.repo";
import {
  AdminUser,
  AdminUserFilters,
  AdminUserMembership,
} from "./admin.types";

const escapeLike = (value: string): string =>
  value.replace(/[\\%_]/g, (char) => `\\${char}`);

const adminUserQuery = () =>
  db
    .selectFrom("users")
    .innerJoin("user_emails", "user_emails.user_id", "users.id")
    .where("users.deleted_at", "is", null)
    .where("user_emails.is_primary", "=", true)
    .select([
      "users.id",
      "users.display_name",
      "user_emails.email",
      "user_emails.is_verified",
      "users.status",
      "users.is_super_admin",
      "users.last_login_at",
      "users.created_at",
      "users.updated_at",
    ]);

export const listUsers = async (
  filters: AdminUserFilters,
  pagination: PaginationQuery,
): Promise<Paginated<AdminUser>> => {
  let query = adminUserQuery()
    .orderBy("users.created_at", "desc")
    .orderBy("users.id", "desc");

  if (filters.search) {
    const pattern = `%${escapeLike(filters.search)}%`;
    query = query.where((eb) =>
      eb.or([
        eb("user_emails.email", "ilike", pattern),
        eb("users.display_name", "ilike", pattern),
      ]),
    );
  }

  if (filters.status) {
    query = query.where("users.status", "=", filters.status);
  }

  if (filters.is_super_admin !== undefined) {
    query = query.where("users.is_super_admin", "=", filters.is_super_admin);
  }

  return await paginate(query, pagination);
};

export const getUser = async (userId: string): Promise<AdminUser | null> => {
  const user = await adminUserQuery()
    .where("users.id", "=", userId)
    .executeTakeFirst();

  return user ?? null;
};

export const getUserMemberships = async (
  userId: string,
): Promise<AdminUserMembership[]> => {
  return await db
    .selectFrom("memberships")
    .innerJoin(
      "organizations",
      "organizations.id",
      "memberships.organization_id",
    )
    .innerJoin("roles", "roles.id", "memberships.role_id")
    .where("memberships.user_id", "=", userId)
    .where("organizations.deleted_at", "is", null)
    .select([
      "memberships.id as membership_id",
      "organizations.id as organization_id",
      "organizations.name as organization_name",
      "roles.id as role_id",
      "roles.name as role_name",
      "memberships.status",
      "memberships.created_at",
    ])
    .orderBy("memberships.created_at", "asc")
    .execute();
};

/**
 * Changes the status and, for anything but ACTIVE, revokes every live session
 * in the same transaction. Returns the revoked session ids.
 */
export const updateUserStatus = async (
  userId: string,
  status: AdminUser["status"],
  audit: AuditEntry,
): Promise<string[]> => {
  return await db.transaction().execute(async (trx) => {
    await trx
      .updateTable("users")
      .set({ status })
      .where("id", "=", userId)
      .where("deleted_at", "is", null)
      .execute();

    let revoked: string[] = [];
    if (status !== "ACTIVE") {
      const rows = await trx
        .updateTable("sessions")
        .set({ revoked_at: sql<string>`now()` })
        .where("user_id", "=", userId)
        .where("revoked_at", "is", null)
        .returning("id")
        .execute();
      revoked = rows.map((row) => row.id);
    }

    await recordAudit(
      {
        ...audit,
        metadata: { ...audit.metadata, revoked_sessions: revoked.length },
      },
      trx,
    );

    return revoked;
  });
};

export const setSuperAdmin = async (
  userId: string,
  isSuperAdmin: boolean,
  audit: AuditEntry,
): Promise<void> => {
  await db.transaction().execute(async (trx) => {
    if (!isSuperAdmin) {
      const superAdmins = await lockSuperAdmins(trx);

      if (superAdmins.includes(userId) && superAdmins.length === 1) {
        throw new ConflictError("Cannot remove the last super admin");
      }
    }

    await trx
      .updateTable("users")
      .set({ is_super_admin: isSuperAdmin })
      .where("id", "=", userId)
      .where("deleted_at", "is", null)
      .execute();

    await recordAudit(audit, trx);
  });
};
