import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../lib/validateBody";
import { validateParams } from "../../lib/validateParams";
import {
  createOrganizationSchema,
  updateOrganizationStatusSchema,
} from "./organizations.schema";
import * as organizationsController from "./organizations.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireSuperAdmin } from "../../middlewares/requireSuperAdmin";

export const organizationsRouter = Router();

organizationsRouter.use(authenticate);

organizationsRouter.post(
  "/create",
  validateBody(createOrganizationSchema),
  organizationsController.createOrganizationController,
);

organizationsRouter.get(
  "/",
  requireSuperAdmin,
  organizationsController.listOrganizationsController,
);

organizationsRouter.patch(
  "/:id/status",
  requireSuperAdmin,
  validateBody(updateOrganizationStatusSchema),
  organizationsController.updateOrganizationStatusController,
);
