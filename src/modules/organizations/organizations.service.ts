import {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/RequestError";
import { getSystemRoleByName } from "../roles/roles.repo";
import { getUserById } from "../users/user.repo";
import * as organizationsRepo from "./organizations.repo";
import * as rolesRepo from "../roles/roles.repo";
import * as permissionsRepo from "../permissions/permissions.repo";
import {
  CreateOrganizationInput,
  CreateRoleInput,
  UpdateOrganizationInput,
  UpdateRoleInput,
} from "./organizations.schema";
import { Organization, PublicOrganization, Role } from "./organizations.types";
import { convertToPublicOrganization } from "./organizations.utils";
import {
  DEFAULT_ORGANIZATION_ROLE_PERMISSIONS,
  PermissionName,
} from "../permissions/permission.catalogue";

const assertNoEscalation = (
  requestedPermissions: string[],
  callerPermissions: Set<PermissionName>,
): void => {
  const notHeld = requestedPermissions.filter(
    (name) => !callerPermissions.has(name as PermissionName),
  );

  if (notHeld.length > 0) {
    throw new ForbiddenError(
      `Cannot grant permissions you do not hold: ${notHeld.join(", ")}`,
    );
  }
};

export const listOrganizations = async (): Promise<Organization[]> => {
  return await organizationsRepo.getAllOrganizations();
};

export const updateOrganizationStatus = async (
  organizationId: string,
  status: Organization["status"],
): Promise<Organization> => {
  const organization = await organizationsRepo.updateOrganizationStatus(
    organizationId,
    status,
  );

  if (!organization) {
    throw new NotFoundError("Organization");
  }

  return organization;
};

export const updateOrganization = async (
  organizationId: string,
  organization: UpdateOrganizationInput,
): Promise<Organization> => {
  const updatedOrganization = await organizationsRepo.updateOrganization(
    organizationId,
    organization,
  );

  if (!updatedOrganization) {
    throw new NotFoundError("Organization");
  }

  return updatedOrganization;
};

export const createOrganization = async (
  organization: CreateOrganizationInput,
  userId: string,
): Promise<PublicOrganization> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  if (user.status !== "ACTIVE") {
    throw new UnauthorizedError(
      "Verify your account before creating an organization",
    );
  }
  const role = await getSystemRoleByName("OWNER");

  if (!role) {
    throw new InternalServerError("Unable to create organization");
  }

  const newOrganization = await organizationsRepo.createOrganization(
    organization,
    userId,
    role.id,
  );

  return convertToPublicOrganization(
    newOrganization,
    role.name,
    user.display_name,
  );
};

export const listCurrentUSerOrganization = async (
  userId: string,
): Promise<PublicOrganization[]> => {
  const organizations =
    await organizationsRepo.getOrganizationsByUserId(userId);

  return organizations;
};

export const getOrganization = async (
  organizationId: string,
): Promise<Organization> => {
  const organization =
    await organizationsRepo.getOrganizationById(organizationId);

  if (!organization) {
    throw new NotFoundError("Organization");
  }

  return organization;
};

export const deleteOrganization = async (
  organizationId: string,
): Promise<void> => {
  const deletedOrganization =
    await organizationsRepo.deleteOrganization(organizationId);

  if (!deletedOrganization) {
    throw new NotFoundError("Organization");
  }
};

export const createRole = async (
  organizationId: string,
  createRoleInput: CreateRoleInput,
  callerPermissions: Set<PermissionName>,
): Promise<Role> => {
  assertNoEscalation(createRoleInput.permissions, callerPermissions);

  const permissions = Array.from(
    new Set<string>([
      ...DEFAULT_ORGANIZATION_ROLE_PERMISSIONS,
      ...createRoleInput.permissions,
    ]),
  );

  const newRole = await rolesRepo.createRole(
    organizationId,
    createRoleInput.role_name,
    createRoleInput.role_description ?? null,
    permissions,
  );

  return newRole;
};

export const listRoles = async (organizationId: string): Promise<Role[]> => {
  const roles = await rolesRepo.getRolesByOrganizationId(organizationId);

  return roles;
};

export const getRoleById = async (
  organizationId: string,
  roleId: string,
): Promise<Role> => {
  const role = await rolesRepo.getRoleById(organizationId, roleId);

  if (!role) {
    throw new NotFoundError("Role");
  }

  return role;
};

export const updateRole = async (
  organizationId: string,
  roleId: string,
  updateRoleInput: UpdateRoleInput,
): Promise<Role> => {
  const updatedRole = await rolesRepo.updateRole(
    organizationId,
    roleId,
    updateRoleInput.role_name,
    updateRoleInput.role_description,
  );

  if (!updatedRole) {
    throw new NotFoundError("Role");
  }

  return updatedRole;
};

export const deleteRole = async (
  organizationId: string,
  roleId: string,
): Promise<void> => {
  await rolesRepo.deleteRole(organizationId, roleId);
};

export const updateRolePermissions = async (
  organizationId: string,
  roleId: string,
  permissions: string[],
  callerPermissions: Set<PermissionName>,
): Promise<Role> => {
  assertNoEscalation(permissions, callerPermissions);

  const role = await rolesRepo.getMutableOrgRoleById(organizationId, roleId);

  if (!role) {
    throw new NotFoundError("Role");
  }

  await permissionsRepo.updateRolePermissions(roleId, permissions);

  const updatedRole = await rolesRepo.getRoleById(organizationId, roleId);

  if (!updatedRole) {
    throw new NotFoundError("Role");
  }

  return updatedRole;
};
