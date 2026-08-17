export type Role = {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  organization_id?: string;
  created_at: Date;
  updated_at: Date;
};
