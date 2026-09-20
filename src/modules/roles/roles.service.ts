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

export const revokePermission = async (
  roleId: string,
  permissionName: string,
): Promise<void> => {
  const role = await roleRepo.getRoleScopeById(roleId);
  if (!role) {
    throw new NotFoundError("Role");
  }

  const permission = await permissionRepo.getPermissionByName(permissionName);
  if (!permission) {
    throw new NotFoundError("Permission not found");
  }

  await roleRepo.revokePermissionFromRole(roleId, permission.id);
};

export const getSystemRoles = async (): Promise<Role[]> => {
  const systemRoles = await roleRepo.getAllSystemRoles();
  return systemRoles;
};

export const getPermissionsForSystemRole = async (
  roleId: string,
): Promise<string[]> => {
  const role = await roleRepo.getRoleScopeById(roleId);
  if (!role) {
    throw new NotFoundError("Role");
  }

  if (!role.is_system_role) {
    throw new ForbiddenError(
      "Only system roles permissions can be fetched here",
    );
  }

  const permissions = await permissionRepo.getPermissionNamesByRoleId(roleId);
  return permissions;
};
