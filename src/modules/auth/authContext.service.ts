import { ForbiddenError } from "../../errors/RequestError";
import * as memberRepo from "../members/members.repo";
import * as permissionRepo from "../permissions/permissions.repo";
import { PermissionName } from "../permissions/permission.catalogue";
import { isPermissionName } from "../permissions/permissions.utils";
import { AuthContext } from "./auth.types";

/**
 * Resolves the caller's authorization context for one organization.
 *
 * Membership is rejected with 403 rather than 404 so a non-member cannot use
 * the response to learn whether an organization id exists.
 */
export const loadAuthContext = async (
  userId: string,
  orgId: string,
): Promise<AuthContext> => {
  const membership = await memberRepo.getMembershipContext(userId, orgId);

  if (!membership) {
    throw new ForbiddenError("Not a member of this organization");
  }

  if (membership.membership_status !== "ACTIVE") {
    throw new ForbiddenError("Membership is not active");
  }

  if (membership.organization_status !== "ACTIVE") {
    throw new ForbiddenError("Organization is suspended");
  }

  const names = await permissionRepo.getPermissionNamesByRoleId(
    membership.role_id,
  );

  const permissions = new Set<PermissionName>(names.filter(isPermissionName));

  return {
    userId,
    orgId,
    membershipId: membership.membership_id,
    roleId: membership.role_id,
    roleName: membership.role_name,
    permissions,
  };
};
