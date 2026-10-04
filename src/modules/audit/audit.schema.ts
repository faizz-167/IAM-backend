import { z } from "zod";
import { paginationQuerySchema } from "../../lib/pagination";

const auditFilterFields = {
  actor_user_id: z.uuid("Actor user id must be a valid UUID").optional(),
  resource: z
    .enum([
      "ORGANIZATION",
      "ROLE",
      "PERMISSION",
      "MEMBERSHIP",
      "USER",
      "INVITATION",
      "SESSION",
      "AUDIT",
    ])
    .optional(),
  action: z.string().trim().min(1).max(255).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
};

const fromBeforeTo = (value: { from?: Date; to?: Date }) =>
  !value.from || !value.to || value.from <= value.to;

export const listOrganizationAuditLogsQuerySchema = paginationQuerySchema
  .extend(auditFilterFields)
  .refine(fromBeforeTo, { message: "from must be before to", path: ["from"] });

export const listAdminAuditLogsQuerySchema = paginationQuerySchema
  .extend({
    ...auditFilterFields,
    organization_id: z.uuid("Organization id must be a valid UUID").optional(),
  })
  .refine(fromBeforeTo, { message: "from must be before to", path: ["from"] });

export type ListOrganizationAuditLogsQuery = z.infer<
  typeof listOrganizationAuditLogsQuerySchema
>;
export type ListAdminAuditLogsQuery = z.infer<
  typeof listAdminAuditLogsQuerySchema
>;
