import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authLimiter } from "../../middlewares/rateLimit";
import { validateParams } from "../../lib/validateParams";
import { invitationTokenParamSchema } from "./invitations.schema";
import * as invitationsController from "./invitations.controller";

// Invitee-side routes. There is no org context here: the caller is not a
// member yet, and the token in the path is the only thing tying them to one.
export const invitationsRouter = Router();

invitationsRouter.get(
  "/:token",
  authLimiter,
  validateParams(invitationTokenParamSchema),
  invitationsController.previewInvitationController,
);

invitationsRouter.post(
  "/:token/accept",
  authLimiter,
  authenticate,
  validateParams(invitationTokenParamSchema),
  invitationsController.acceptInvitationController,
);

invitationsRouter.post(
  "/:token/decline",
  authLimiter,
  authenticate,
  validateParams(invitationTokenParamSchema),
  invitationsController.declineInvitationController,
);
