import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireSuperAdmin } from "../../middlewares/requireSuperAdmin";
import * as roleController from "./roles.controller";
import { validateBody } from "../../lib/validateBody";
import {
  assignPermissionSchema,
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

systemRolesRouter.post(
  "/:roleId/permissions",
  requireSuperAdmin,
  validateParams(roleIdParamSchema),
  validateBody(assignPermissionSchema),
  roleController.assignPermissionToSystemRoles,
);
