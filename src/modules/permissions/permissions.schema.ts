import { z } from "zod";
import { PermissionName } from "./permission.catalogue";
import { isPermissionName, permissionName } from "./permissions.utils";

export const createPermissionSchema = z
  .object({
    description: z.string().min(1, "Description is required"),
    resource: z.enum([
      "ORGANIZATION",
      "ROLE",
      "MEMBERSHIP",
      "AUDIT",
      "PERMISSION",
    ]),
    action: z.enum(["CREATE", "READ", "UPDATE", "DELETE"]),
  })
  // The catalogue is a subset of every resource x action pair, so reject the
  // combinations that are not real permissions.
  .refine(
    ({ resource, action }) => isPermissionName(permissionName(resource, action)),
    {
      message: "This resource and action combination is not a permission",
      path: ["action"],
    },
  );

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;

/** What the repository actually inserts: the input plus its derived name. */
export type CreatePermissionRecord = CreatePermissionInput & {
  name: PermissionName;
};
