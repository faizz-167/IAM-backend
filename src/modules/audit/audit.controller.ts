import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import * as auditService from "./audit.service";
import {
  ListAdminAuditLogsQuery,
  ListOrganizationAuditLogsQuery,
} from "./audit.schema";

export const listOrganizationAuditLogsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.orgId as string;
    const { page, limit, ...filters } =
      req.validatedQuery as ListOrganizationAuditLogsQuery;
    const result = await auditService.listAuditLogs(
      { ...filters, organization_id: orgId },
      { page, limit },
    );
    res
      .status(200)
      .json(success(result.items, { pagination: result.pagination }));
  } catch (error) {
    next(error);
  }
};

export const listAdminAuditLogsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit, ...filters } =
      req.validatedQuery as ListAdminAuditLogsQuery;
    const result = await auditService.listAuditLogs(filters, { page, limit });
    res
      .status(200)
      .json(success(result.items, { pagination: result.pagination }));
  } catch (error) {
    next(error);
  }
};
