import { BadRequestError } from "../../errors/RequestError";
import { CreatePermissionInput } from "./permissions.schema";
import { Permission } from "./permissions.types";
import * as permissionRepo from "./permissions.repo";
import { isPermissionName, permissionName } from "./permissions.utils";

export const createPermission = async (
  permissionData: CreatePermissionInput,
): Promise<Permission> => {
  const name = permissionName(permissionData.resource, permissionData.action);

  if (!isPermissionName(name)) {
    throw new BadRequestError(
      "This resource and action combination is not a permission",
    );
  }

  const permission = await permissionRepo.createPermission({
    ...permissionData,
    name,
  });

  return permission;
};

export const getAllPermissions = async (): Promise<Permission[]> => {
  const permissions = await permissionRepo.getAllPermissions();
  return permissions;
};
