import { Router } from "express";
import { validateBody } from "../../lib/validateBody";
import { validateParams } from "../../lib/validateParams";
import {
  createOrganizationSchema,
  organizationIdParamSchema,
  updateOrganizationStatusSchema,
} from "./organizations.schema";
import * as organizationsController from "./organizations.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireSuperAdmin } from "../../middlewares/requireSuperAdmin";

export const organizationsRouter = Router();

organizationsRouter.use(authenticate);

organizationsRouter.post(
  "/",
  validateBody(createOrganizationSchema),
  organizationsController.createOrganizationController,
);

organizationsRouter.get(
  "/",
  organizationsController.getMyOrganizationsController,
);

organizationsRouter.get(
  "/admin",
  requireSuperAdmin,
  organizationsController.listOrganizationsController,
);

organizationsRouter.patch(
  "/:id/status",
  requireSuperAdmin,
  validateParams(organizationIdParamSchema),
  validateBody(updateOrganizationStatusSchema),
  organizationsController.updateOrganizationStatusController,
);
