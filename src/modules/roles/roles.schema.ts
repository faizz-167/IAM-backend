import { z } from "zod";

export const systemRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const assignPermissionSchema = z.object({
  permission_name: z.string().min(1, "Permission name is required"),
});

export const roleIdParamSchema = z.object({
  roleId: z.uuid("Role id must be a valid UUID"),
});

export type SystemRoleInput = z.infer<typeof systemRoleSchema>;
export type AssignPermissionInput = z.infer<typeof assignPermissionSchema>;
