import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import * as roleService from "./roles.service";
import { UnauthorizedError } from "../../errors/RequestError";

export const createSystemRolesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("User ID not found in request");
    }
    const systemRole = await roleService.createSystemRoles(req.body, userId);

    res
      .status(201)
      .json(
        success(systemRole, { message: "System role created successfully" }),
      );
  } catch (error) {
    next(error);
  }
};
