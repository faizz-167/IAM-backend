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
import { setOrgId } from "../../middlewares/organization.middleware";
import { getAuthContext } from "../../middlewares/getAuthContext";
import { requirePermission } from "../../middlewares/requirePermission";
import { PERMISSIONS } from "../permissions/permission.catalogue";

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
  "/:orgId/status",
  requireSuperAdmin,
  validateParams(organizationIdParamSchema),
  validateBody(updateOrganizationStatusSchema),
  organizationsController.updateOrganizationStatusController,
);

organizationsRouter.get(
  "/:orgId",
  validateParams(organizationIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ORGANIZATION_READ),
  organizationsController.getOrganizationController,
);
