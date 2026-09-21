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

export type PublicOrganization = Organization & {
  created_by_name: string | null;
  role_name: string;
};

export type Role = {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  is_system_role: boolean;
  permissions: string[];
  created_at: Date;
  updated_at: Date;
};
