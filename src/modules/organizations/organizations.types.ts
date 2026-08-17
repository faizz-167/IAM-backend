export type OrganizationStatus = "ACTIVE" | "SUSPENDED";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
};
