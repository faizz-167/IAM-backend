import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),
  role_id: z.uuid("Role id must be a valid UUID"),
});

export const invitationIdParamSchema = z.object({
  invitationId: z.uuid("Invitation id must be a valid UUID"),
});

export const invitationTokenParamSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Invitation token is invalid"),
});

export const listInvitationsQuerySchema = z.object({
  status: z
    .enum(["PENDING", "ACCEPTED", "REJECTED", "EXPIRED", "REVOKED"])
    .optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type ListInvitationsQuery = z.infer<typeof listInvitationsQuerySchema>;
