import { AssignPermissionInput, SystemRoleInput } from "./roles.schema";
import * as roleRepo from "./roles.repo";
import * as permissionRepo from "../permissions/permissions.repo";
import { Role } from "./roles.types";
import { ConflictError, NotFoundError } from "../../errors/RequestError";

export const createSystemRoles = async (
  input: SystemRoleInput,
): Promise<Role> => {
  const role = await roleRepo.createSystemRole(input);
  return role;
};

export const assignPermission = async (
  input: AssignPermissionInput,
  roleId: string,
): Promise<void> => {
  const permission = await permissionRepo.getPermissionByName(
    input.permission_name,
  );
  if (!permission) {
    throw new NotFoundError("Permission not found");
  }

  const permissions = await roleRepo.getPermissionsByRoleId(roleId);
  if (permissions.find((p) => p.permission_id === permission.id)) {
    throw new ConflictError("Permission already assigned to role");
  }

  await roleRepo.assignPermissionToRole(roleId, permission.id);
};
