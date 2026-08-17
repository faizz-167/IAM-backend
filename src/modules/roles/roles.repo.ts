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
