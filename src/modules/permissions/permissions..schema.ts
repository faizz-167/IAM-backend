import { z } from "zod";

export const createPermissionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  resource: z.enum([
    "ORGANIZATION",
    "ROLE",
    "MEMBERSHIP",
    "AUDIT",
    "PERMISSION",
  ]),
  action: z.enum(["CREATE", "READ", "UPDATE", "DELETE"]),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
