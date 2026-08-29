import { db } from "../../database";
import { ConflictError } from "../../errors/RequestError";
import { SystemRoleInput } from "./roles.schema";
import { Role } from "./roles.types";

export const createSystemRole = async (
  roleData: SystemRoleInput,
): Promise<Role> => {
  if (await isSystemRoleExists(roleData.name)) {
    throw new ConflictError("System role already exists");
  }

  const newRole = await db
    .insertInto("roles")
    .values({
      name: roleData.name,
      description: roleData.description,
      is_system_role: true,
    })
    .returning([
      "id",
      "name",
      "description",
      "is_system_role",
      "organization_id",
      "created_at",
      "updated_at",
    ])
    .executeTakeFirstOrThrow();

  return newRole;
};

export const isSystemRoleExists = async (name: string): Promise<boolean> => {
  const role = await db
    .selectFrom("roles")
    .where("name", "=", name)
    .where("is_system_role", "=", true)
    .select("id")
    .executeTakeFirst();

  return role ? true : false;
};

export const getSystemRoleByName = async (
  name: string,
): Promise<Role | undefined> => {
  const role = await db
    .selectFrom("roles")
    .where("name", "=", name)
    .where("is_system_role", "=", true)
    .select([
      "id",
      "name",
      "description",
      "is_system_role",
      "organization_id",
      "created_at",
      "updated_at",
    ])
    .executeTakeFirst();
  return role;
};

/**
 * Returns false when the pair was already there. The service checks first for a
 * clean 409, but two concurrent assignments would both pass that check, so the
 * insert has to tolerate the loser rather than surface a raw 23505 as a 500.
 */
export const assignPermissionToRole = async (
  roleId: string,
  permissionId: string,
): Promise<boolean> => {
  const inserted = await db
    .insertInto("role_permissions")
    .values({
      role_id: roleId,
      permission_id: permissionId,
    })
    .onConflict((oc) => oc.columns(["role_id", "permission_id"]).doNothing())
    .returning("id")
    .executeTakeFirst();

  return inserted !== undefined;
};

export const roleHasPermission = async (
  roleId: string,
  permissionId: string,
): Promise<boolean> => {
  const row = await db
    .selectFrom("role_permissions")
    .where("role_id", "=", roleId)
    .where("permission_id", "=", permissionId)
    .select("id")
    .executeTakeFirst();

  return row !== undefined;
};

export const getRoleScopeById = async (roleId: string) => {
  const role = await db
    .selectFrom("roles")
    .where("id", "=", roleId)
    .select(["id", "is_system_role", "organization_id"])
    .executeTakeFirst();

  return role ?? null;
};
