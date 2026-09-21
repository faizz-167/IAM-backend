import { z } from "zod";
import {
  ALL_PERMISSION_NAMES,
  PermissionName,
} from "../permissions/permission.catalogue";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(255)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug may contain only lowercase letters, numbers and single hyphens",
    ),
});

export const updateOrganizationStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const organizationIdParamSchema = z.object({
  orgId: z.uuid("Organization id must be a valid UUID"),
});

export type UpdateOrganizationStatusInput = z.infer<
  typeof updateOrganizationStatusSchema
>;

export const createRoleSchema = z.object({
  role_name: z.string().trim().min(1, "Name is required").max(255),
  role_description: z.string().trim().max(1000).optional(),
  permissions: z
    .array(
      z.enum(ALL_PERMISSION_NAMES as [PermissionName, ...PermissionName[]]),
    )
    .optional()
    .default([]),
});

export type UpdateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type OrganizationIdParam = z.infer<typeof organizationIdParamSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
