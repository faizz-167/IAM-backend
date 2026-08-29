import { PermissionName } from "../permissions/permission.catalogue";
import { UserWithCredentials } from "../users/user.types";

export type PublicUser = Omit<
  UserWithCredentials,
  "password_hash" | "failed_login_attempts" | "locked_until" | "is_super_admin"
>;

export type PublicUserWithToken = {
  user: PublicUser;
  token: string;
};

export type LoginResult = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Everything a request needs to authorize an action inside one organization.
 *
 * Deliberately carries no super-admin flag: super admins are a platform-level
 * role (monitoring organizations, defining system roles and permissions) and
 * hold no implicit power inside an organization. Inside org scope they are an
 * ordinary member and are bound by the role their membership points at.
 */
export type AuthContext = {
  userId: string;
  orgId: string;
  membershipId: string;
  roleId: string;
  roleName: string;
  permissions: Set<PermissionName>;
};
