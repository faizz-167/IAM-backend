import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import * as roleService from "./roles.service";

export const createSystemRolesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const systemRole = await roleService.createSystemRoles(req.body);

    res
      .status(201)
      .json(
        success(systemRole, { message: "System role created successfully" }),
      );
  } catch (error) {
    next(error);
  }
};

export const assignPermissionToSystemRoles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roleId = req.params.roleId as string;
    await roleService.assignPermission(req.body, roleId);
    res.status(200).json(success("Permission assigned successfully"));
  } catch (error) {
    next(error);
  }
};
