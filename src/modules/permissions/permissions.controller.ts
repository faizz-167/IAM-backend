import { Request, Response, NextFunction } from "express";
import * as permissionService from "./permissions.service";
import { success } from "../../lib/response";

export const createPermissionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const permission = await permissionService.createPermission(req.body);
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
    const permissions = await permissionService.getAllPermissions();
    res.status(200).json(success(permissions));
  } catch (error) {
    next(error);
  }
};
