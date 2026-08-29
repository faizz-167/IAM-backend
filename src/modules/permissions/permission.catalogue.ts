import { PermissionAction, PermissionResource } from "./permissions.types";

export const PERMISSIONS = {
  ORGANIZATION_READ: "ORGANIZATION:READ",
  ORGANIZATION_UPDATE: "ORGANIZATION:UPDATE",
  ORGANIZATION_DELETE: "ORGANIZATION:DELETE",

  ROLE_CREATE: "ROLE:CREATE",
  ROLE_READ: "ROLE:READ",
  ROLE_UPDATE: "ROLE:UPDATE",
  ROLE_DELETE: "ROLE:DELETE",

  MEMBERSHIP_CREATE: "MEMBERSHIP:CREATE",
  MEMBERSHIP_READ: "MEMBERSHIP:READ",
  MEMBERSHIP_UPDATE: "MEMBERSHIP:UPDATE",
  MEMBERSHIP_DELETE: "MEMBERSHIP:DELETE",

  AUDIT_READ: "AUDIT:READ",
} as const satisfies Record<
  string,
  `${PermissionResource}:${PermissionAction}`
>;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSION_NAMES = Object.values(
  PERMISSIONS,
) as PermissionName[];
