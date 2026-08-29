import { z } from "zod";

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

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type OrganizationIdParam = z.infer<typeof organizationIdParamSchema>;
