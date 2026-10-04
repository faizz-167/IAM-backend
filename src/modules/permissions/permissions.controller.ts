import { Request, Response, NextFunction } from "express";
import * as permissionService from "./permissions.service";
import { success } from "../../lib/response";
import { PaginationQuery } from "../../lib/pagination";

export const createPermissionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const permission = await permissionService.createPermission(
      req.body,
      req.userId as string,
    );
    res
      .status(201)
      .json(
        success(permission, { message: "Permission created successfully" }),
      );
  } catch (error) {
    next(error);
  }
};

export const getAllPermissionsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await permissionService.getAllPermissions(
      req.validatedQuery as PaginationQuery,
    );
    res
      .status(200)
      .json(success(result.items, { pagination: result.pagination }));
  } catch (error) {
    next(error);
  }
};

export const deletePermissionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await permissionService.deletePermission(
      req.params.permissionId as string,
      req.userId as string,
    );
    res
      .status(200)
      .json(success(null, { message: "Permission deleted successfully" }));
  } catch (error) {
    next(error);
  }
};
