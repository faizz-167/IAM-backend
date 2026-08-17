import { CreatePermissionInput } from "./permissions.schema";
import { Permission } from "./permissions.types";
import * as permissionRepo from "./permissions.repo";

export const createPermission = async (
  permissionData: CreatePermissionInput,
): Promise<Permission> => {
  const permission = await permissionRepo.createPermission(permissionData);

  return permission;
};

export const getAllPermissions = async (): Promise<Permission[]> => {
  const permissions = await permissionRepo.getAllPermissions();
  return permissions;
};
