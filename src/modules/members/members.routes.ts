import { Router } from "express";
import { organizationIdParamSchema } from "../organizations/organizations.schema";
import { setOrgId } from "../../middlewares/organization.middleware";
import { getAuthContext } from "../../middlewares/getAuthContext";
import { PERMISSIONS } from "../permissions/permission.catalogue";
import { validateParams } from "../../lib/validateParams";
import * as membersController from "./members.controller";
import { requirePermission } from "../../middlewares/requirePermission";

export const membersRouter = Router();
