import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireSuperAdmin } from "../../middlewares/requireSuperAdmin";
import * as roleController from "./roles.controller";
import { validateBody } from "../../lib/validateBody";
import {
  assignPermissionSchema,
  permissionNameParamSchema,
  roleIdParamSchema,
  systemRoleSchema,
} from "./roles.schema";
import { validateParams } from "../../lib/validateParams";

export const rolesRouter = Router();
export const systemRolesRouter = Router();

rolesRouter.use(authenticate);
systemRolesRouter.use(authenticate);

systemRolesRouter.post(
  "/",
  requireSuperAdmin,
  validateBody(systemRoleSchema),
  roleController.createSystemRolesController,
);

systemRolesRouter.get(
  "/",
  requireSuperAdmin,
  roleController.getSystemRolesController,
);

systemRolesRouter.post(
  "/:roleId/permissions",
  requireSuperAdmin,
  validateParams(roleIdParamSchema),
  validateBody(assignPermissionSchema),
  roleController.assignPermissionToSystemRoles,
);

systemRolesRouter.delete(
  "/:roleId/permissions/:permissionName",
  requireSuperAdmin,
  validateParams(roleIdParamSchema),
  validateParams(permissionNameParamSchema),
  roleController.revokePermissionFromSystemRoles,
);

systemRolesRouter.get(
  "/:roleId/permissions",
  authenticate,
  validateParams(roleIdParamSchema),
  roleController.getPermissionsForSystemRole,
);
