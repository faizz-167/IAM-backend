import {
  ColumnType,
  Generated,
  GeneratedAlways,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

type UserStatus = "ACTIVE" | "SUSPENDED" | "LOCKED" | "PENDING";

interface UsersTable {
  id: GeneratedAlways<string>; // uuid
  display_name: string;
  status: Generated<UserStatus>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, never>;
  deleted_at: ColumnType<Date | null, string | null | undefined, string | null>;
  last_login_at: ColumnType<
    Date | null,
    string | null | undefined,
    string | null
  >;
}

interface UserEmailsTable {
  id: GeneratedAlways<string>;
  user_id: string;
  email: string;
  is_primary: Generated<boolean>;
  is_verified: Generated<boolean>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, never>;
}

interface UserCredentialsTable {
  id: GeneratedAlways<string>;
  user_id: string;
  type: Generated<string>;
  password_hash: string;
  failed_login_attempts: Generated<number>;
  locked_until: ColumnType<
    Date | null,
    string | null | undefined,
    string | null
  >;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, never>;
}

type OrganizationStatus = "ACTIVE" | "SUSPENDED";

interface OrganizationsTable {
  id: GeneratedAlways<string>;
  name: string;
  slug: string;
  status: Generated<OrganizationStatus>;
  created_by: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, never>;
  deleted_at: ColumnType<Date | null, string | null | undefined, string | null>;
}

interface RolesTable {
  id: GeneratedAlways<string>;
  name: string;
  description: string | null;
  is_system_role: Generated<boolean>;
  organization_id: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, never>;
}

type PermissionResource =
  | "ORGANIZATION"
  | "ROLE"
  | "MEMBERSHIP"
  | "USER"
  | "INVITATION"
  | "SESSION"
  | "AUDIT";

type PermissionAction = "CREATE" | "READ" | "UPDATE" | "DELETE";

interface PermissionsTable {
  id: GeneratedAlways<string>;
  resource: PermissionResource;
  action: PermissionAction;
  name: string;
  description: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

interface RolePermissionsTable {
  id: GeneratedAlways<string>;
  role_id: string;
  permission_id: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

type MembershipStatus = "ACTIVE" | "SUSPENDED" | "REMOVED";

interface MembershipsTable {
  id: GeneratedAlways<string>;
  user_id: string;
  organization_id: string;
  role_id: string;
  status: Generated<MembershipStatus>;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, never>;
}

type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "REVOKED";

interface InvitationsTable {
  id: GeneratedAlways<string>;
  organization_id: string;
  email: string;
  role_id: string;
  status: Generated<InvitationStatus>;
  invited_by: string | null;
  token_hash: string;
  expires_at: ColumnType<Date, string, string>;
  accepted_at: ColumnType<
    Date | null,
    string | null | undefined,
    string | null
  >;
  created_at: ColumnType<Date, string | undefined, never>;
}

interface SessionsTable {
  id: GeneratedAlways<string>;
  user_id: string;
  refresh_token_hash: string;
  family_id: Generated<string>;
  replaced_by: string | null;
  device_name: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  expires_at: ColumnType<Date, string, string>;
  revoked_at: ColumnType<Date | null, string | null | undefined, string | null>;
}

interface AuditLogsTable {
  id: GeneratedAlways<string>;
  organization_id: string | null;
  actor_user_id: string | null;
  action: string;
  resource: PermissionResource;
  target_id: string | null;
  metadata: Generated<Record<string, unknown>>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface Database {
  users: UsersTable;
  user_emails: UserEmailsTable;
  user_credentials: UserCredentialsTable;
  organizations: OrganizationsTable;
  roles: RolesTable;
  permissions: PermissionsTable;
  role_permissions: RolePermissionsTable;
  memberships: MembershipsTable;
  invitations: InvitationsTable;
  sessions: SessionsTable;
  audit_logs: AuditLogsTable;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export type UserEmail = Selectable<UserEmailsTable>;
export type NewUserEmail = Insertable<UserEmailsTable>;

export type UserCredential = Selectable<UserCredentialsTable>;
export type NewUserCredential = Insertable<UserCredentialsTable>;
export type UserCredentialUpdate = Updateable<UserCredentialsTable>;

export type Organization = Selectable<OrganizationsTable>;
export type NewOrganization = Insertable<OrganizationsTable>;
export type OrganizationUpdate = Updateable<OrganizationsTable>;

export type Role = Selectable<RolesTable>;
export type NewRole = Insertable<RolesTable>;
export type RoleUpdate = Updateable<RolesTable>;

export type Permission = Selectable<PermissionsTable>;
export type NewPermission = Insertable<PermissionsTable>;
export type PermissionUpdate = Updateable<PermissionsTable>;

export type RolePermission = Selectable<RolePermissionsTable>;
export type NewRolePermission = Insertable<RolePermissionsTable>;

export type Membership = Selectable<MembershipsTable>;
export type NewMembership = Insertable<MembershipsTable>;
export type MembershipUpdate = Updateable<MembershipsTable>;

export type Invitation = Selectable<InvitationsTable>;
export type NewInvitation = Insertable<InvitationsTable>;
export type InvitationUpdate = Updateable<InvitationsTable>;

export type Session = Selectable<SessionsTable>;
export type NewSession = Insertable<SessionsTable>;
export type SessionUpdate = Updateable<SessionsTable>;

export type AuditLog = Selectable<AuditLogsTable>;
export type NewAuditLog = Insertable<AuditLogsTable>;
