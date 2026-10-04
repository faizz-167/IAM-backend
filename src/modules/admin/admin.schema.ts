import { z } from "zod";
import { paginationQuerySchema } from "../../lib/pagination";

export const listUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(255).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "LOCKED", "PENDING"]).optional(),
  is_super_admin: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const userIdParamSchema = z.object({
  userId: z.uuid("User id must be a valid UUID"),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "LOCKED"]),
});

export const updateSuperAdminSchema = z.object({
  is_super_admin: z.boolean(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
