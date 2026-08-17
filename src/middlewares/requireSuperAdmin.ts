import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/RequestError";
import { getUserById } from "../modules/users/user.repo";

export const requireSuperAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.userId) {
      throw new UnauthorizedError("User ID not found in request");
    }

    const user = await getUserById(req.userId);
    if (!user || !user.is_super_admin) {
      throw new ForbiddenError("Super admin access required");
    }

    next();
  } catch (error) {
    next(error);
  }
};
