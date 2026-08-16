import { db } from "../../database";
import { getUserById } from "../users/user.repo";
import { CreatePermissionInput } from "./permissions..schema";
import { Permission } from "./permissions.types";
import * as permissionRepo from "./permissions.repo";

export const createPermission = async (
  permissionData: CreatePermissionInput,
  userId: string,
): Promise<Permission> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  const permission = await permissionRepo.createPermission(permissionData);

  return permission;
};

export const getAllPermissions = async (): Promise<Permission[]> => {
  const permissions = await permissionRepo.getAllPermissions();
  return permissions;
};
