export type InvitationStatus =
  "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "REVOKED";

export type Invitation = {
  id: string;
  organization_id: string;
  email: string;
  role_id: string;
  status: InvitationStatus;
  invited_by: string | null;
  created_at: Date;
  expires_at: Date;
};

export type CreateInvitationRecord = {
  organizationId: string;
  email: string;
  roleId: string;
  invitedBy: string;
  tokenHash: string;
  expiresAt: Date;
};

export type InvitationWithRole = Invitation & {
  role_name: string;
};

export type InvitationFilters = {
  status?: InvitationStatus;
};

/**
 * What the token holder is shown before signing in. Deliberately narrow: the
 * token is the only credential, so nothing beyond the org and role leaks.
 */
export type InvitationPreview = {
  organization_name: string;
  role_name: string;
  expires_at: Date;
};

export type InvitationByToken = {
  id: string;
  organization_id: string;
  organization_name: string;
  email: string;
  role_id: string;
  role_name: string;
  status: InvitationStatus;
  expires_at: Date;
};
