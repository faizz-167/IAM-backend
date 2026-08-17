import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import * as roleController from "./roles.controller";
import { validateBody } from "../../lib/validateBody";
import { systemRoleSchema } from "./roles.schema";

export const rolesRouter = Router();
export const systemRolesRouter = Router();

systemRolesRouter.post(
  "/",
  authenticate,
  validateBody(systemRoleSchema),
  roleController.createSystemRolesController,
);
