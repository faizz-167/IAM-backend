import { Router } from "express";
import { validateBody } from "../../lib/validateBody";
import { createPermissionSchema } from "./permissions.schema";
import * as permissionsController from "./permissions.controller";
import { authenticate } from "../../middlewares/auth.middleware";

export const permissionsRouter = Router();

permissionsRouter.post(
  "/create",
  authenticate,
  validateBody(createPermissionSchema),
  permissionsController.createPermissionController,
);

permissionsRouter.get("/", permissionsController.getAllPermissionsController);
