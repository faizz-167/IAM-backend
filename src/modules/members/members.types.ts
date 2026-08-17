export type MemberShip = {
  id: string;
  user_id: string;
  organization_id: string;
  role_id: string;
  status: "ACTIVE" | "SUSPENDED" | "REMOVED";
  created_at: Date;
  updated_at: Date;
};

export type CreateMemberShipInput = {
  user_id: string;
  organization_id: string;
  role_id: string;
};
