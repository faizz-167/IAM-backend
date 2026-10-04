import argon2 from "argon2";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  UnauthenticatedError,
} from "../../errors/RequestError";
import { denyAccessForSessions } from "../../lib/accessTokenDenylist";
import { recordAudit } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/audit.types";
import { getCurrentUser } from "../auth/auth.service";
import { PublicUser } from "../auth/auth.types";
import { getSystemRoleByName } from "../roles/roles.repo";
import { revokeOtherUserSessions } from "../sessions/sessions.repo";
import * as userRepo from "./user.repo";
import { ChangePasswordInput, UpdateMeInput } from "./user.schema";
import { UserWithCredentials } from "./user.types";

const getUserWithPassword = async (
  userId: string,
  password: string,
): Promise<UserWithCredentials> => {
  const user = await userRepo.getUserById(userId);
  if (!user) {
    throw new UnauthenticatedError("User not found");
  }

  if (!(await argon2.verify(user.password_hash, password))) {
    throw new BadRequestError("Current password is incorrect");
  }

  return user;
};

export const updateMe = async (
  userId: string,
  input: UpdateMeInput,
): Promise<PublicUser> => {
  const before = await getCurrentUser(userId);

  await userRepo.updateDisplayName(userId, input.display_name);

  await recordAudit({
    action: AUDIT_ACTIONS.USER_PROFILE_UPDATED,
    resource: "USER",
    actorUserId: userId,
    targetId: userId,
    metadata: {
      display_name: { from: before.display_name, to: input.display_name },
    },
  });

  return await getCurrentUser(userId);
};

export const changePassword = async (
  userId: string,
  currentSessionId: string,
  input: ChangePasswordInput,
): Promise<void> => {
  await getUserWithPassword(userId, input.current_password);

  if (input.current_password === input.new_password) {
    throw new BadRequestError(
      "New password must be different from the current password",
    );
  }

  const passwordHash = await argon2.hash(input.new_password, {
    type: argon2.argon2id,
  });
  await userRepo.updatePasswordHash(userId, passwordHash);

  // The caller keeps the session they changed it from; every other device is
  // signed out.
  const revoked = await revokeOtherUserSessions(userId, currentSessionId);
  await denyAccessForSessions(revoked);

  await recordAudit({
    action: AUDIT_ACTIONS.USER_PASSWORD_CHANGED,
    resource: "USER",
    actorUserId: userId,
    targetId: userId,
    metadata: { revoked_sessions: revoked.length },
  });
};

export const deleteMe = async (
  userId: string,
  password: string,
): Promise<void> => {
  await getUserWithPassword(userId, password);

  const ownerRole = await getSystemRoleByName("OWNER");
  if (!ownerRole) {
    throw new InternalServerError("System role OWNER is not configured");
  }

  // Deleting an owner would leave the organization with nobody who can manage
  // or delete it.
  if (await userRepo.isOwnerOfAnyOrganization(userId, ownerRole.id)) {
    throw new ConflictError(
      "Transfer ownership or delete the organizations you own before deleting your account",
    );
  }

  const revoked = await userRepo.softDeleteUser(userId, {
    action: AUDIT_ACTIONS.USER_DELETED,
    resource: "USER",
    actorUserId: userId,
    targetId: userId,
  });
  await denyAccessForSessions(revoked);
};
