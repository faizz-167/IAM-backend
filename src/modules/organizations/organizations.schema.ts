import { z } from "zod";

export const updateOrganizationStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export type UpdateOrganizationStatusInput = z.infer<
  typeof updateOrganizationStatusSchema
>;
