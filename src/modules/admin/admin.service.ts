import { ForbiddenError, NotFoundError } from "../../errors/RequestError";
import { denyAccessForSessions } from "../../lib/accessTokenDenylist";
import { Paginated } from "../../lib/pagination";
import { recordAudit } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/audit.types";
import { revokeAllUserSessions } from "../sessions/sessions.repo";
import * as adminRepo from "./admin.repo";
import { ListUsersQuery } from "./admin.schema";
import { AdminUser, AdminUserDetail } from "./admin.types";

const getExistingUser = async (userId: string): Promise<AdminUser> => {
  const user = await adminRepo.getUser(userId);

  if (!user) {
    throw new NotFoundError("User");
  }

  return user;
};

export const listUsers = async (
  query: ListUsersQuery,
): Promise<Paginated<AdminUser>> => {
  const { page, limit, ...filters } = query;
  return await adminRepo.listUsers(filters, { page, limit });
};

export const getUser = async (userId: string): Promise<AdminUserDetail> => {
  const user = await getExistingUser(userId);
  const memberships = await adminRepo.getUserMemberships(userId);

  return { ...user, memberships };
};

export const updateUserStatus = async (
  actorUserId: string,
  userId: string,
  status: "ACTIVE" | "SUSPENDED" | "LOCKED",
): Promise<AdminUser> => {
  if (actorUserId === userId) {
    throw new ForbiddenError("You cannot change your own status");
  }

  const user = await getExistingUser(userId);

  const revoked = await adminRepo.updateUserStatus(userId, status, {
    action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
    resource: "USER",
    actorUserId,
    targetId: userId,
    metadata: { from: user.status, to: status },
  });
  await denyAccessForSessions(revoked);

  return await getExistingUser(userId);
};

export const updateSuperAdmin = async (
  actorUserId: string,
  userId: string,
  isSuperAdmin: boolean,
): Promise<AdminUser> => {
  const user = await getExistingUser(userId);

  if (user.is_super_admin === isSuperAdmin) {
    return user;
  }

  // authenticate reads is_super_admin fresh on every request, so the change
  // bites immediately without touching sessions.
  await adminRepo.setSuperAdmin(userId, isSuperAdmin, {
    action: isSuperAdmin
      ? AUDIT_ACTIONS.USER_SUPER_ADMIN_GRANTED
      : AUDIT_ACTIONS.USER_SUPER_ADMIN_REVOKED,
    resource: "USER",
    actorUserId,
    targetId: userId,
  });

  return await getExistingUser(userId);
};

export const revokeUserSessions = async (
  actorUserId: string,
  userId: string,
): Promise<number> => {
  await getExistingUser(userId);

  const revoked = await revokeAllUserSessions(userId);
  await denyAccessForSessions(revoked);

  await recordAudit({
    action: AUDIT_ACTIONS.SESSIONS_FORCE_REVOKED,
    resource: "SESSION",
    actorUserId,
    targetId: userId,
    metadata: { revoked_sessions: revoked.length },
  });

  return revoked.length;
};
