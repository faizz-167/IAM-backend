import { Router } from "express";
import { validateBody } from "../../lib/validateBody";
import { createPermissionSchema } from "./permissions.schema";
import * as permissionsController from "./permissions.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireSuperAdmin } from "../../middlewares/requireSuperAdmin";

export const permissionsRouter = Router();

permissionsRouter.post(
  "/create",
  authenticate,
  requireSuperAdmin,
  validateBody(createPermissionSchema),
  permissionsController.createPermissionController,
);

permissionsRouter.get(
  "/",
  authenticate,
  permissionsController.getAllPermissionsController,
);
