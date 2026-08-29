import { OrganizationStatus } from "../organizations/organizations.types";

export type MembershipStatus = "ACTIVE" | "SUSPENDED" | "REMOVED";

export type MemberShip = {
  id: string;
  user_id: string;
  organization_id: string;
  role_id: string;
  status: MembershipStatus;
  created_at: Date;
  updated_at: Date;
};

export type CreateMemberShipInput = {
  user_id: string;
  organization_id: string;
  role_id: string;
};

/**
 * A user's membership joined with the org and role it points at, so building an
 * auth context needs a single round trip.
 */
export type MembershipContext = {
  membership_id: string;
  membership_status: MembershipStatus;
  organization_status: OrganizationStatus;
  role_id: string;
  role_name: string;
};
