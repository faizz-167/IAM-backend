import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../lib/validateBody";
import { validateParams } from "../../lib/validateParams";
import { updateOrganizationStatusSchema } from "./organizations.schema";
import * as organizationsController from "./organizations.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireSuperAdmin } from "../../middlewares/requireSuperAdmin";

export const organizationsRouter = Router();

const orgIdParamSchema = z.object({ id: z.uuid("Invalid organization id") });

organizationsRouter.get(
  "/",
  authenticate,
  requireSuperAdmin,
  organizationsController.listOrganizationsController,
);

organizationsRouter.patch(
  "/:id/status",
  authenticate,
  requireSuperAdmin,
  validateParams(orgIdParamSchema),
  validateBody(updateOrganizationStatusSchema),
  organizationsController.updateOrganizationStatusController,
);
