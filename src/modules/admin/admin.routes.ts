import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireSuperAdmin } from "../../middlewares/requireSuperAdmin";
import { validateBody } from "../../lib/validateBody";
import { validateParams } from "../../lib/validateParams";
import { validateQuery } from "../../lib/validateQuery";
import { listAdminAuditLogsQuerySchema } from "../audit/audit.schema";
import * as auditController from "../audit/audit.controller";
import {
  listUsersQuerySchema,
  updateSuperAdminSchema,
  updateUserStatusSchema,
  userIdParamSchema,
} from "./admin.schema";
import * as adminController from "./admin.controller";

export const adminRouter = Router();

adminRouter.use(authenticate, requireSuperAdmin);

adminRouter.get(
  "/audit-logs",
  validateQuery(listAdminAuditLogsQuerySchema),
  auditController.listAdminAuditLogsController,
);

adminRouter.get(
  "/users",
  validateQuery(listUsersQuerySchema),
  adminController.listUsersController,
);

adminRouter.get(
  "/users/:userId",
  validateParams(userIdParamSchema),
  adminController.getUserController,
);

adminRouter.patch(
  "/users/:userId/status",
  validateParams(userIdParamSchema),
  validateBody(updateUserStatusSchema),
  adminController.updateUserStatusController,
);

adminRouter.patch(
  "/users/:userId/super-admin",
  validateParams(userIdParamSchema),
  validateBody(updateSuperAdminSchema),
  adminController.updateSuperAdminController,
);

adminRouter.delete(
  "/users/:userId/sessions",
  validateParams(userIdParamSchema),
  adminController.revokeUserSessionsController,
);
