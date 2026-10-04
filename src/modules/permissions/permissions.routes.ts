import { Router } from "express";
import { validateBody } from "../../lib/validateBody";
import {
  createPermissionSchema,
  permissionIdParamSchema,
} from "./permissions.schema";
import { validateParams } from "../../lib/validateParams";
import { validateQuery } from "../../lib/validateQuery";
import { paginationQuerySchema } from "../../lib/pagination";
import * as permissionsController from "./permissions.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireSuperAdmin } from "../../middlewares/requireSuperAdmin";

export const permissionsRouter = Router();

permissionsRouter.post(
  "/",
  authenticate,
  requireSuperAdmin,
  validateBody(createPermissionSchema),
  permissionsController.createPermissionController,
);

permissionsRouter.get(
  "/",
  authenticate,
  validateQuery(paginationQuerySchema),
  permissionsController.getAllPermissionsController,
);

permissionsRouter.delete(
  "/:permissionId",
  authenticate,
  requireSuperAdmin,
  validateParams(permissionIdParamSchema),
  permissionsController.deletePermissionController,
);
