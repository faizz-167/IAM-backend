import { UserStatus } from "../users/user.types";
import { MembershipStatus } from "../members/members.types";

export type AdminUser = {
  id: string;
  display_name: string;
  email: string;
  is_verified: boolean;
  status: UserStatus;
  is_super_admin: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type AdminUserMembership = {
  membership_id: string;
  organization_id: string;
  organization_name: string;
  role_id: string;
  role_name: string;
  status: MembershipStatus;
  created_at: Date;
};

export type AdminUserDetail = AdminUser & {
  memberships: AdminUserMembership[];
};

export type AdminUserFilters = {
  search?: string;
  status?: UserStatus;
  is_super_admin?: boolean;
};
