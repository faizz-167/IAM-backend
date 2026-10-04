import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../errors/RequestError";
import { Paginated, PaginationQuery } from "../../lib/pagination";
import { recordAudit } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/audit.types";
import { DEFAULT_ORGANIZATION_ROLE_PERMISSIONS } from "./permission.catalogue";
import { CreatePermissionInput } from "./permissions.schema";
import { Permission } from "./permissions.types";
import * as permissionRepo from "./permissions.repo";
import { isPermissionName, permissionName } from "./permissions.utils";

export const createPermission = async (
  permissionData: CreatePermissionInput,
  actorUserId: string,
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

  await recordAudit({
    action: AUDIT_ACTIONS.PERMISSION_CREATED,
    resource: "PERMISSION",
    actorUserId,
    targetId: permission.id,
    metadata: { name: permission.name },
  });

  return permission;
};

export const getAllPermissions = async (
  pagination: PaginationQuery,
): Promise<Paginated<Permission>> => {
  return await permissionRepo.getAllPermissions(pagination);
};

export const deletePermission = async (
  permissionId: string,
  actorUserId: string,
): Promise<void> => {
  const permission = await permissionRepo.getPermissionById(permissionId);

  if (!permission) {
    throw new NotFoundError("Permission");
  }

  // Every new organization role is seeded with these; deleting one would make
  // role creation fail.
  if (
    (DEFAULT_ORGANIZATION_ROLE_PERMISSIONS as readonly string[]).includes(
      permission.name,
    )
  ) {
    throw new ConflictError(
      "Default organization permissions cannot be deleted",
    );
  }

  if (!(await permissionRepo.deletePermissionIfUnused(permissionId))) {
    const roles = await permissionRepo.countRolesWithPermission(permissionId);
    throw new ConflictError(
      `Permission is still assigned to ${roles} role(s); revoke it first`,
    );
  }

  await recordAudit({
    action: AUDIT_ACTIONS.PERMISSION_DELETED,
    resource: "PERMISSION",
    actorUserId,
    targetId: permissionId,
    metadata: { name: permission.name },
  });
};
