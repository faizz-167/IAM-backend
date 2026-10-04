import { AuditResource } from "../../database/types";

export const AUDIT_ACTIONS = {
  ORGANIZATION_CREATED: "organization.created",
  ORGANIZATION_UPDATED: "organization.updated",
  ORGANIZATION_STATUS_CHANGED: "organization.status_changed",
  ORGANIZATION_DELETED: "organization.deleted",

  ROLE_CREATED: "role.created",
  ROLE_UPDATED: "role.updated",
  ROLE_DELETED: "role.deleted",
  ROLE_PERMISSIONS_UPDATED: "role.permissions_updated",
  SYSTEM_ROLE_CREATED: "system_role.created",
  SYSTEM_ROLE_PERMISSION_ASSIGNED: "system_role.permission_assigned",
  SYSTEM_ROLE_PERMISSION_REVOKED: "system_role.permission_revoked",

  PERMISSION_CREATED: "permission.created",
  PERMISSION_DELETED: "permission.deleted",

  MEMBERSHIP_ROLE_CHANGED: "membership.role_changed",
  MEMBERSHIP_STATUS_CHANGED: "membership.status_changed",
  MEMBERSHIP_REMOVED: "membership.removed",
  MEMBERSHIP_LEFT: "membership.left",

  INVITATION_CREATED: "invitation.created",
  INVITATION_RESENT: "invitation.resent",
  INVITATION_REVOKED: "invitation.revoked",
  INVITATION_ACCEPTED: "invitation.accepted",
  INVITATION_DECLINED: "invitation.declined",

  USER_REGISTERED: "user.registered",
  USER_EMAIL_VERIFIED: "user.email_verified",
  USER_LOGIN: "user.login",
  USER_LOGIN_FAILED: "user.login_failed",
  USER_LOGOUT: "user.logout",
  USER_LOGOUT_ALL: "user.logout_all",
  USER_PROFILE_UPDATED: "user.profile_updated",
  USER_PASSWORD_CHANGED: "user.password_changed",
  USER_PASSWORD_RESET_REQUESTED: "user.password_reset_requested",
  USER_PASSWORD_RESET: "user.password_reset",
  USER_DELETED: "user.deleted",
  USER_STATUS_CHANGED: "user.status_changed",
  USER_SUPER_ADMIN_GRANTED: "user.super_admin_granted",
  USER_SUPER_ADMIN_REVOKED: "user.super_admin_revoked",

  SESSION_REVOKED: "session.revoked",
  SESSIONS_FORCE_REVOKED: "session.force_revoked",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export type AuditEntry = {
  action: AuditAction;
  resource: AuditResource;
  actorUserId: string | null;
  organizationId?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

export type AuditLog = {
  id: string;
  organization_id: string | null;
  actor_user_id: string | null;
  actor_display_name: string | null;
  action: string;
  resource: AuditResource;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
};

export type AuditLogFilters = {
  organization_id?: string;
  actor_user_id?: string;
  resource?: AuditResource;
  action?: string;
  from?: Date;
  to?: Date;
};

/**
 * Handed to repositories that own a transaction, so the audit row is built
 * from the record they create and written before that transaction commits.
 */
export type AuditBuilder<T> = (record: T) => AuditEntry;
