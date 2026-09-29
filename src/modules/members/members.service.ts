import {
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../../errors/RequestError";
import { AuthContext } from "../auth/auth.types";
import { PermissionName } from "../permissions/permission.catalogue";
import * as permissionsRepo from "../permissions/permissions.repo";
import { assertNoEscalation } from "../permissions/permissions.utils";
import * as rolesRepo from "../roles/roles.repo";
import * as membershipsRepo from "./members.repo";
import { MemberShip } from "./members.types";

const OWNER_ROLE_NAME = "OWNER";
const ADMIN_ROLE_NAME = "ADMIN";

const getSystemRoleId = async (name: string): Promise<string> => {
  const role = await rolesRepo.getSystemRoleByName(name);

  if (!role) {
    throw new InternalServerError(`System role ${name} is not configured`);
  }

  return role.id;
};

const getManageableMembership = async (
  authContext: AuthContext,
  membershipId: string,
): Promise<MemberShip> => {
  const membership = await membershipsRepo.getOrganizationMembership(
    authContext.orgId,
    membershipId,
  );

  if (!membership) {
    throw new NotFoundError("Membership");
  }

  if (membership.id === authContext.membershipId) {
    throw new ForbiddenError("You cannot change your own membership");
  }

  if (membership.role_id === (await getSystemRoleId(OWNER_ROLE_NAME))) {
    throw new ForbiddenError("The organization owner cannot be modified");
  }

  const targetPermissions = await permissionsRepo.getPermissionNamesByRoleId(
    membership.role_id,
  );
  const notHeld = targetPermissions.filter(
    (name) => !authContext.permissions.has(name as PermissionName),
  );

  if (notHeld.length > 0) {
    throw new ForbiddenError(
      "Cannot manage a member whose role has permissions you do not hold",
    );
  }

  return membership;
};

export const updateMemberRole = async (
  authContext: AuthContext,
  membershipId: string,
  newRoleId: string,
): Promise<MemberShip> => {
  await getManageableMembership(authContext, membershipId);

  const role = await rolesRepo.getRoleById(authContext.orgId, newRoleId);

  if (!role) {
    throw new NotFoundError("Role");
  }

  if (role.id === (await getSystemRoleId(OWNER_ROLE_NAME))) {
    throw new ForbiddenError(
      "Ownership cannot be assigned through a role change",
    );
  }

  assertNoEscalation(role.permissions, authContext.permissions);

  const updatedMember = await membershipsRepo.updateMemberRole(
    authContext.orgId,
    membershipId,
    role.id,
  );

  if (!updatedMember) {
    throw new NotFoundError("Membership");
  }

  return updatedMember;
};

export const updateMemberStatus = async (
  authContext: AuthContext,
  membershipId: string,
  newStatus: MemberShip["status"],
): Promise<MemberShip> => {
  await getManageableMembership(authContext, membershipId);

  const updatedMember = await membershipsRepo.updateMemberStatus(
    authContext.orgId,
    membershipId,
    newStatus,
  );

  if (!updatedMember) {
    throw new NotFoundError("Membership");
  }

  return updatedMember;
};

export const deleteMembership = async (
  authContext: AuthContext,
  membershipId: string,
): Promise<void> => {
  await getManageableMembership(authContext, membershipId);

  const deleted = await membershipsRepo.deleteMembership(
    authContext.orgId,
    membershipId,
  );

  if (!deleted) {
    throw new NotFoundError("Membership");
  }
};

export const deleteMyMembership = async (
  authContext: AuthContext,
): Promise<void> => {
  const ownerRoleId = await getSystemRoleId(OWNER_ROLE_NAME);

  if (authContext.roleId !== ownerRoleId) {
    await membershipsRepo.deleteMembership(
      authContext.orgId,
      authContext.membershipId,
    );
    return;
  }

  const transferred = await membershipsRepo.transferOwnershipAndLeave(
    authContext.orgId,
    authContext.membershipId,
    ownerRoleId,
    await getSystemRoleId(ADMIN_ROLE_NAME),
  );

  if (!transferred) {
    throw new ConflictError(
      "Promote a member to admin before leaving: the organization needs an owner",
    );
  }
};
