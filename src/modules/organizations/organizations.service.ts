import {
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/RequestError";
import { getSystemRoleByName } from "../roles/roles.repo";
import { getUserById } from "../users/user.repo";
import * as organizationsRepo from "./organizations.repo";
import * as rolesRepo from "../roles/roles.repo";
import * as permissionsRepo from "../permissions/permissions.repo";
import * as membersRepo from "../members/members.repo";
import {
  CreateOrganizationInput,
  CreateRoleInput,
  UpdateOrganizationInput,
  UpdateRoleInput,
  ListOrganizationsQuery,
} from "./organizations.schema";
import { Organization, PublicOrganization, Role } from "./organizations.types";
import { convertToPublicOrganization } from "./organizations.utils";
import {
  DEFAULT_ORGANIZATION_ROLE_PERMISSIONS,
  PermissionName,
} from "../permissions/permission.catalogue";
import { Member, MemberFilters } from "../members/members.types";
import { assertNoEscalation } from "../permissions/permissions.utils";
import { recordAudit } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/audit.types";
import { Paginated, PaginationQuery } from "../../lib/pagination";

export const listOrganizations = async (
  filters: ListOrganizationsQuery,
): Promise<Paginated<Organization>> => {
  const { page, limit, status } = filters;
  return await organizationsRepo.getAllOrganizations(status, { page, limit });
};

export const updateOrganizationStatus = async (
  organizationId: string,
  status: Organization["status"],
  actorUserId: string,
): Promise<Organization> => {
  const organization = await organizationsRepo.updateOrganizationStatus(
    organizationId,
    status,
  );

  if (!organization) {
    throw new NotFoundError("Organization");
  }

  await recordAudit({
    action: AUDIT_ACTIONS.ORGANIZATION_STATUS_CHANGED,
    resource: "ORGANIZATION",
    actorUserId,
    organizationId,
    targetId: organizationId,
    metadata: { status },
  });

  return organization;
};

export const updateOrganization = async (
  organizationId: string,
  organization: UpdateOrganizationInput,
  actorUserId: string,
): Promise<Organization> => {
  const updatedOrganization = await organizationsRepo.updateOrganization(
    organizationId,
    organization,
  );

  if (!updatedOrganization) {
    throw new NotFoundError("Organization");
  }

  await recordAudit({
    action: AUDIT_ACTIONS.ORGANIZATION_UPDATED,
    resource: "ORGANIZATION",
    actorUserId,
    organizationId,
    targetId: organizationId,
    metadata: { changes: organization },
  });

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
    (created) => ({
      action: AUDIT_ACTIONS.ORGANIZATION_CREATED,
      resource: "ORGANIZATION",
      actorUserId: userId,
      organizationId: created.id,
      targetId: created.id,
      metadata: { name: created.name, slug: created.slug },
    }),
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
  actorUserId: string,
): Promise<void> => {
  const deletedOrganization =
    await organizationsRepo.deleteOrganization(organizationId);

  if (!deletedOrganization) {
    throw new NotFoundError("Organization");
  }

  await recordAudit({
    action: AUDIT_ACTIONS.ORGANIZATION_DELETED,
    resource: "ORGANIZATION",
    actorUserId,
    organizationId,
    targetId: organizationId,
  });
};

export const createRole = async (
  organizationId: string,
  createRoleInput: CreateRoleInput,
  callerPermissions: Set<PermissionName>,
  actorUserId: string,
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
    (created) => ({
      action: AUDIT_ACTIONS.ROLE_CREATED,
      resource: "ROLE",
      actorUserId,
      organizationId,
      targetId: created.id,
      metadata: { name: created.name, permissions: created.permissions },
    }),
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
  actorUserId: string,
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

  await recordAudit({
    action: AUDIT_ACTIONS.ROLE_UPDATED,
    resource: "ROLE",
    actorUserId,
    organizationId,
    targetId: roleId,
    metadata: {
      name: updateRoleInput.role_name,
      description: updateRoleInput.role_description,
    },
  });

  return updatedRole;
};

export const deleteRole = async (
  organizationId: string,
  roleId: string,
  actorUserId: string,
): Promise<void> => {
  await rolesRepo.deleteRole(organizationId, roleId);

  await recordAudit({
    action: AUDIT_ACTIONS.ROLE_DELETED,
    resource: "ROLE",
    actorUserId,
    organizationId,
    targetId: roleId,
  });
};

export const updateRolePermissions = async (
  organizationId: string,
  roleId: string,
  permissions: string[],
  callerPermissions: Set<PermissionName>,
  actorUserId: string,
): Promise<Role> => {
  assertNoEscalation(permissions, callerPermissions);

  const role = await rolesRepo.getMutableOrgRoleById(organizationId, roleId);

  if (!role) {
    throw new NotFoundError("Role");
  }

  const permissionsWithDefaults = Array.from(
    new Set<string>([...DEFAULT_ORGANIZATION_ROLE_PERMISSIONS, ...permissions]),
  );

  await permissionsRepo.updateRolePermissions(roleId, permissionsWithDefaults, {
    action: AUDIT_ACTIONS.ROLE_PERMISSIONS_UPDATED,
    resource: "ROLE",
    actorUserId,
    organizationId,
    targetId: roleId,
    metadata: { before: role.permissions, after: permissionsWithDefaults },
  });

  const updatedRole = await rolesRepo.getRoleById(organizationId, roleId);

  if (!updatedRole) {
    throw new NotFoundError("Role");
  }

  return updatedRole;
};

export const listOrganizationMembers = async (
  organizationId: string,
  filters: MemberFilters,
  pagination: PaginationQuery,
): Promise<Paginated<Member>> => {
  return await membersRepo.getOrganizationMembers(
    organizationId,
    filters,
    pagination,
  );
};
