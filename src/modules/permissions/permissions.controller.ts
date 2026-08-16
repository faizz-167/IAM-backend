import { Request, Response, NextFunction } from "express";
import * as permissionService from "./permissions.service";
import { success } from "../../lib/response";
import { UnauthorizedError } from "../../errors/RequestError";

export const createPermissionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("User ID not found in request");
    }
    const permission = await permissionService.createPermission(
      req.body,
      userId,
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
    const permissions = await permissionService.getAllPermissions();
    res.status(200).json(success(permissions));
  } catch (error) {
    next(error);
  }
};
