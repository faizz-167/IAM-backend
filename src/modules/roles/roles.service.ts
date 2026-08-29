import { AssignPermissionInput, SystemRoleInput } from "./roles.schema";
import * as roleRepo from "./roles.repo";
import * as permissionRepo from "../permissions/permissions.repo";
import { Role } from "./roles.types";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../errors/RequestError";

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
  const role = await roleRepo.getRoleScopeById(roleId);
  if (!role) {
    throw new NotFoundError("Role");
  }

  // Super admins define the system catalogue only. Permissions on an
  // organization's own roles are managed inside that organization.
  if (!role.is_system_role || role.organization_id !== null) {
    throw new ForbiddenError("Only system roles can be modified here");
  }

  const permission = await permissionRepo.getPermissionByName(
    input.permission_name,
  );
  if (!permission) {
    throw new NotFoundError("Permission not found");
  }

  if (await roleRepo.roleHasPermission(roleId, permission.id)) {
    throw new ConflictError("Permission already assigned to role");
  }

  const assigned = await roleRepo.assignPermissionToRole(roleId, permission.id);
  if (!assigned) {
    throw new ConflictError("Permission already assigned to role");
  }
};
