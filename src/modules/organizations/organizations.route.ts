import { Router } from "express";
import { validateBody } from "../../lib/validateBody";
import { validateParams } from "../../lib/validateParams";
import {
  createOrganizationSchema,
  createRoleSchema,
  organizationIdParamSchema,
  updateOrganizationSchema,
  updateOrganizationStatusSchema,
} from "./organizations.schema";
import * as organizationsController from "./organizations.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireSuperAdmin } from "../../middlewares/requireSuperAdmin";
import { setOrgId } from "../../middlewares/organization.middleware";
import { getAuthContext } from "../../middlewares/getAuthContext";
import { requirePermission } from "../../middlewares/requirePermission";
import { PERMISSIONS } from "../permissions/permission.catalogue";
import { roleIdParamSchema } from "../roles/roles.schema";

export const organizationsRouter = Router({ mergeParams: true });

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

organizationsRouter.patch(
  "/:orgId",
  validateParams(organizationIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ORGANIZATION_UPDATE),
  validateBody(updateOrganizationSchema),
  organizationsController.updateOrganizationController,
);

organizationsRouter.delete(
  "/:orgId",
  validateParams(organizationIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ORGANIZATION_DELETE),
  organizationsController.deleteOrganizationController,
);

organizationsRouter.post(
  "/:orgId/roles",
  validateParams(organizationIdParamSchema),
  validateBody(createRoleSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ROLE_CREATE),
  organizationsController.createRoleController,
);

organizationsRouter.get(
  "/:orgId/roles",
  validateParams(organizationIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ROLE_READ),
  organizationsController.listRolesController,
);

organizationsRouter.get(
  "/:orgId/roles/:roleId",
  validateParams(organizationIdParamSchema),
  validateParams(roleIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ROLE_READ),
  organizationsController.listRoleByIdController,
);

organizationsRouter.patch(
  "/:orgId/roles/:roleId",
  validateParams(organizationIdParamSchema),
  validateParams(roleIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ROLE_UPDATE),
  validateBody(createRoleSchema),
  organizationsController.updateRoleController,
);
