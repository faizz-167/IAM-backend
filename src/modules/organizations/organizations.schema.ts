import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
});

export const updateOrganizationStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export type UpdateOrganizationStatusInput = z.infer<
  typeof updateOrganizationStatusSchema
>;

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
