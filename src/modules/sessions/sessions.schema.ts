import { z } from "zod";

export const sessionIdParamSchema = z.object({
  sessionId: z.uuid("Session id must be a valid UUID"),
});
