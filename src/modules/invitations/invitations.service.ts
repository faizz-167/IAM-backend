import crypto from "node:crypto";
import { env } from "../../config/env";
import { sendInvitationEmail } from "../../common-services/mail.service";
import {
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../../errors/RequestError";
import { hashToken } from "../../lib/token";
import { Paginated } from "../../lib/pagination";
import { recordAudit } from "../audit/audit.service";
import { AUDIT_ACTIONS } from "../audit/audit.types";
import { logger } from "../../lib/logger";
import { AuthContext } from "../auth/auth.types";
import * as organizationsRepo from "../organizations/organizations.repo";
import { assertNoEscalation } from "../permissions/permissions.utils";
import * as rolesRepo from "../roles/roles.repo";
import * as invitationsRepo from "./invitations.repo";
import {
  CreateInvitationInput,
  ListInvitationsQuery,
} from "./invitations.schema";
import {
  Invitation,
  InvitationByToken,
  InvitationPreview,
  InvitationWithRole,
} from "./invitations.types";

const OWNER_ROLE_NAME = "OWNER";
const INVITATION_TOKEN_BYTES = 32;

const newInvitationToken = (): string =>
  crypto.randomBytes(INVITATION_TOKEN_BYTES).toString("hex");

const newInvitationExpiry = (): Date =>
  new Date(Date.now() + env.invitationTtlDays * 24 * 60 * 60 * 1000);

export const createInvitation = async (
  authContext: AuthContext,
  input: CreateInvitationInput,
): Promise<Invitation> => {
  const { orgId } = authContext;

  const organization = await organizationsRepo.getOrganizationById(orgId);

  if (!organization) {
    throw new NotFoundError("Organization");
  }

  const role = await rolesRepo.getRoleById(orgId, input.role_id);

  if (!role) {
    throw new NotFoundError("Role");
  }

  if (role.is_system_role && role.name === OWNER_ROLE_NAME) {
    throw new ForbiddenError(
      "Ownership cannot be granted through an invitation",
    );
  }

  assertNoEscalation(role.permissions, authContext.permissions);

  if (await invitationsRepo.isEmailMemberOfOrganization(orgId, input.email)) {
    throw new ConflictError(
      "This user is already a member of the organization",
    );
  }

  await invitationsRepo.expireStaleInvitations(orgId, input.email);

  const token = newInvitationToken();
  const invitation = await invitationsRepo.createInvitation({
    organizationId: orgId,
    email: input.email,
    roleId: role.id,
    invitedBy: authContext.userId,
    tokenHash: hashToken(token),
    expiresAt: newInvitationExpiry(),
  });

  try {
    await sendInvitationEmail({
      email: invitation.email,
      organizationName: organization.name,
      roleName: role.name,
      token,
      expiresAt: invitation.expires_at,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to send invitation email");
    await invitationsRepo.deleteInvitation(invitation.id);
    throw new InternalServerError("Failed to send invitation email");
  }

  await recordAudit({
    action: AUDIT_ACTIONS.INVITATION_CREATED,
    resource: "INVITATION",
    actorUserId: authContext.userId,
    organizationId: orgId,
    targetId: invitation.id,
    metadata: { email: invitation.email, role_id: invitation.role_id },
  });

  return invitation;
};

export const listInvitations = async (
  authContext: AuthContext,
  query: ListInvitationsQuery,
): Promise<Paginated<InvitationWithRole>> => {
  const { page, limit, ...filters } = query;
  await invitationsRepo.expireStaleInvitations(authContext.orgId);
  return await invitationsRepo.listInvitations(authContext.orgId, filters, {
    page,
    limit,
  });
};

export const resendInvitation = async (
  authContext: AuthContext,
  invitationId: string,
): Promise<Invitation> => {
  const { orgId } = authContext;

  const existing = await invitationsRepo.getOrganizationInvitation(
    orgId,
    invitationId,
  );

  if (!existing) {
    throw new NotFoundError("Invitation");
  }

  if (existing.status !== "PENDING" && existing.status !== "EXPIRED") {
    throw new ConflictError(
      `An invitation that is ${existing.status.toLowerCase()} cannot be resent`,
    );
  }

  const organization = await organizationsRepo.getOrganizationById(orgId);

  if (!organization) {
    throw new NotFoundError("Organization");
  }

  const role = await rolesRepo.getRoleById(orgId, existing.role_id);

  if (!role) {
    throw new NotFoundError("Role");
  }

  // The resender may hold less than the original inviter did.
  assertNoEscalation(role.permissions, authContext.permissions);

  if (
    await invitationsRepo.isEmailMemberOfOrganization(orgId, existing.email)
  ) {
    throw new ConflictError(
      "This user is already a member of the organization",
    );
  }

  const token = newInvitationToken();
  const invitation = await invitationsRepo.reissueInvitation(
    orgId,
    invitationId,
    hashToken(token),
    newInvitationExpiry(),
  );

  if (!invitation) {
    throw new ConflictError("This invitation can no longer be resent");
  }

  // The previous token is already dead at this point. If the mail fails the
  // invitation stays PENDING with a token nobody holds; resending again fixes it.
  try {
    await sendInvitationEmail({
      email: invitation.email,
      organizationName: organization.name,
      roleName: role.name,
      token,
      expiresAt: invitation.expires_at,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to resend invitation email");
    throw new InternalServerError("Failed to send invitation email");
  }

  await recordAudit({
    action: AUDIT_ACTIONS.INVITATION_RESENT,
    resource: "INVITATION",
    actorUserId: authContext.userId,
    organizationId: orgId,
    targetId: invitation.id,
    metadata: { email: invitation.email },
  });

  return invitation;
};

export const revokeInvitation = async (
  authContext: AuthContext,
  invitationId: string,
): Promise<void> => {
  const { orgId } = authContext;

  await invitationsRepo.expireStaleInvitations(orgId);

  const revoked = await invitationsRepo.revokeInvitation(orgId, invitationId);

  if (revoked) {
    await recordAudit({
      action: AUDIT_ACTIONS.INVITATION_REVOKED,
      resource: "INVITATION",
      actorUserId: authContext.userId,
      organizationId: orgId,
      targetId: invitationId,
      metadata: { email: revoked.email },
    });
    return;
  }

  const existing = await invitationsRepo.getOrganizationInvitation(
    orgId,
    invitationId,
  );

  if (!existing) {
    throw new NotFoundError("Invitation");
  }

  throw new ConflictError(
    `An invitation that is ${existing.status.toLowerCase()} cannot be revoked`,
  );
};

/**
 * Resolves a raw token to an invitation that can still be acted on. Anything
 * else (unknown, closed, expired, org deleted) is the same 404, so the endpoint
 * reveals nothing about tokens the caller does not hold a live copy of.
 */
const getOpenInvitationByToken = async (
  token: string,
): Promise<InvitationByToken> => {
  const invitation = await invitationsRepo.getInvitationByTokenHash(
    hashToken(token),
  );

  if (!invitation || invitation.status !== "PENDING") {
    throw new NotFoundError("Invitation");
  }

  if (invitation.expires_at.getTime() <= Date.now()) {
    await invitationsRepo.markInvitationExpired(invitation.id);
    throw new NotFoundError("Invitation");
  }

  return invitation;
};

/**
 * The invitation is bound to the address it was sent to. Without this check a
 * leaked or forwarded token is a free membership for whoever opens it.
 */
const assertInvitee = async (
  userId: string,
  invitation: InvitationByToken,
): Promise<void> => {
  const email = await invitationsRepo.getUserEmailVerification(
    userId,
    invitation.email,
  );

  if (!email) {
    throw new ForbiddenError(
      "This invitation was sent to a different email address",
    );
  }

  if (!email.is_verified) {
    throw new ForbiddenError(
      "Verify your email address before responding to this invitation",
    );
  }
};

export const previewInvitation = async (
  token: string,
): Promise<InvitationPreview> => {
  const invitation = await getOpenInvitationByToken(token);

  return {
    organization_name: invitation.organization_name,
    role_name: invitation.role_name,
    expires_at: invitation.expires_at,
  };
};

export const acceptInvitation = async (
  userId: string,
  token: string,
): Promise<{ membership_id: string; organization_id: string }> => {
  const invitation = await getOpenInvitationByToken(token);
  await assertInvitee(userId, invitation);

  const accepted = await invitationsRepo.acceptInvitation(
    invitation.id,
    userId,
    (created) => ({
      action: AUDIT_ACTIONS.INVITATION_ACCEPTED,
      resource: "INVITATION",
      actorUserId: userId,
      organizationId: created.organization_id,
      targetId: invitation.id,
      metadata: {
        membership_id: created.membership_id,
        role_id: invitation.role_id,
      },
    }),
  );

  if (!accepted) {
    throw new NotFoundError("Invitation");
  }

  return accepted;
};

export const declineInvitation = async (
  userId: string,
  token: string,
): Promise<void> => {
  const invitation = await getOpenInvitationByToken(token);
  await assertInvitee(userId, invitation);

  if (!(await invitationsRepo.rejectInvitation(invitation.id))) {
    throw new NotFoundError("Invitation");
  }

  await recordAudit({
    action: AUDIT_ACTIONS.INVITATION_DECLINED,
    resource: "INVITATION",
    actorUserId: userId,
    organizationId: invitation.organization_id,
    targetId: invitation.id,
  });
};
