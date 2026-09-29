import z from "zod";

export const membershipIdParamSchema = z.object({
  membershipId: z.uuid("Membership id must be a valid UUID"),
});
