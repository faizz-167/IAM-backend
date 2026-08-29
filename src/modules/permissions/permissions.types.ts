export type PermissionResource =
  | "ORGANIZATION"
  | "ROLE"
  | "MEMBERSHIP"
  | "AUDIT";
export type PermissionAction = "CREATE" | "READ" | "UPDATE" | "DELETE";

export type Permission = {
  id: string;
  name: string;
  description: string | null;
  resource: PermissionResource;
  action: PermissionAction;
  created_at: Date;
};
