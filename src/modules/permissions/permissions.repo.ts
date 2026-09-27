import { db } from "../../database";
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

export const getAllPermissions = async (): Promise<Permission[]> => {
  const permissions = await db
    .selectFrom("permissions")
    .select(["id", "name", "description", "resource", "action", "created_at"])
    .orderBy("created_at", "asc")
    .execute();

  return permissions;
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
): Promise<void> => {
  await db.transaction().execute(async (trx) => {
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
