import { db } from "../../database";
import { paginate, Paginated, PaginationQuery } from "../../lib/pagination";
import { recordAudit } from "../audit/audit.service";
import { AuditEntry } from "../audit/audit.types";
import { ConflictError, NotFoundError } from "../../errors/RequestError";
import { CreatePermissionRecord } from "./permissions.schema";
import { Permission } from "./permissions.types";

export const createPermission = async (
  permissionData: CreatePermissionRecord,
): Promise<Permission> => {
  if (await isPermissionExists(permissionData.name)) {
    throw new ConflictError("Permission already exists");
  }

  const permission = await db
    .insertInto("permissions")
    .values(permissionData)
    .returning([
      "id",
      "name",
      "description",
      "resource",
      "action",
      "created_at",
    ])
    .executeTakeFirstOrThrow();

  return permission;
};

export const isPermissionExists = async (name: string): Promise<boolean> => {
  const permission = await db
    .selectFrom("permissions")
    .select("id")
    .where("name", "=", name)
    .executeTakeFirst();

  return permission ? true : false;
};

export const getAllPermissions = async (
  pagination: PaginationQuery,
): Promise<Paginated<Permission>> => {
  const query = db
    .selectFrom("permissions")
    .select(["id", "name", "description", "resource", "action", "created_at"])
    .orderBy("created_at", "asc")
    .orderBy("id", "asc");

  return await paginate(query, pagination);
};

export const getPermissionById = async (
  permissionId: string,
): Promise<Permission | null> => {
  const permission = await db
    .selectFrom("permissions")
    .select(["id", "name", "description", "resource", "action", "created_at"])
    .where("id", "=", permissionId)
    .executeTakeFirst();

  return permission ?? null;
};

export const countRolesWithPermission = async (
  permissionId: string,
): Promise<number> => {
  const row = await db
    .selectFrom("role_permissions")
    .where("permission_id", "=", permissionId)
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .executeTakeFirstOrThrow();

  return Number(row.count);
};

/**
 * Deletes the permission only while no role holds it. The check and the delete
 * run in one statement, so a concurrent assignment cannot slip in between and
 * be cascaded away.
 */
export const deletePermissionIfUnused = async (
  permissionId: string,
): Promise<boolean> => {
  const deleted = await db
    .deleteFrom("permissions")
    .where("id", "=", permissionId)
    .where(({ not, exists, selectFrom }) =>
      not(
        exists(
          selectFrom("role_permissions")
            .select("role_permissions.id")
            .whereRef("role_permissions.permission_id", "=", "permissions.id"),
        ),
      ),
    )
    .returning("id")
    .executeTakeFirst();

  return deleted !== undefined;
};

export const getPermissionByName = async (
  name: string,
): Promise<Permission | null> => {
  const permission = await db
    .selectFrom("permissions")
    .select(["id", "name", "description", "resource", "action", "created_at"])
    .where("name", "=", name)
    .executeTakeFirst();

  return permission ?? null;
};

export const getPermissionNamesByRoleId = async (
  roleId: string,
): Promise<string[]> => {
  const rows = await db
    .selectFrom("role_permissions")
    .innerJoin(
      "permissions",
      "permissions.id",
      "role_permissions.permission_id",
    )
    .where("role_permissions.role_id", "=", roleId)
    .select("permissions.name")
    .execute();

  return rows.map((row) => row.name);
};

export const updateRolePermissions = async (
  roleId: string,
  permissionNames: string[],
  audit?: AuditEntry,
): Promise<void> => {
  await db.transaction().execute(async (trx) => {
    if (audit) {
      await recordAudit(audit, trx);
    }

    await trx
      .deleteFrom("role_permissions")
      .where("role_id", "=", roleId)
      .execute();

    if (permissionNames.length === 0) {
      return;
    }

    const permissionRows = await trx
      .selectFrom("permissions")
      .where("name", "in", permissionNames)
      .select(["id", "name"])
      .execute();

    const missing = permissionNames.filter(
      (name) => !permissionRows.some((permission) => permission.name === name),
    );

    if (missing.length > 0) {
      throw new NotFoundError(`Permission ${missing.join(", ")}`);
    }

    await trx
      .insertInto("role_permissions")
      .values(
        permissionRows.map((permission) => ({
          role_id: roleId,
          permission_id: permission.id,
        })),
      )
      .execute();
  });
};
