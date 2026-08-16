import { db } from "../../database";
import { ConflictError } from "../../errors/RequestError";
import { CreatePermissionInput } from "./permissions..schema";
import { Permission } from "./permissions.types";

export const createPermission = async (
  permissionData: CreatePermissionInput,
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
