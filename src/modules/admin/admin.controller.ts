import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import * as adminService from "./admin.service";
import { ListUsersQuery } from "./admin.schema";

export const listUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await adminService.listUsers(
      req.validatedQuery as ListUsersQuery,
    );
    res
      .status(200)
      .json(success(result.items, { pagination: result.pagination }));
  } catch (error) {
    next(error);
  }
};

export const getUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await adminService.getUser(req.params.userId as string);
    res.status(200).json(success(user));
  } catch (error) {
    next(error);
  }
};

export const updateUserStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await adminService.updateUserStatus(
      req.userId as string,
      req.params.userId as string,
      req.body.status,
    );
    res
      .status(200)
      .json(success(user, { message: "User status updated successfully" }));
  } catch (error) {
    next(error);
  }
};

export const updateSuperAdminController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await adminService.updateSuperAdmin(
      req.userId as string,
      req.params.userId as string,
      req.body.is_super_admin,
    );
    res
      .status(200)
      .json(
        success(user, { message: "Super admin access updated successfully" }),
      );
  } catch (error) {
    next(error);
  }
};

export const revokeUserSessionsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const revoked = await adminService.revokeUserSessions(
      req.userId as string,
      req.params.userId as string,
    );
    res
      .status(200)
      .json(
        success(
          { revoked_sessions: revoked },
          { message: "User sessions revoked successfully" },
        ),
      );
  } catch (error) {
    next(error);
  }
};
