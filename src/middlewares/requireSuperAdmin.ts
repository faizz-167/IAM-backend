import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/RequestError";

export const requireSuperAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return next(new UnauthorizedError("User ID not found in request"));
  }

  if (!req.isSuperAdmin) {
    return next(new ForbiddenError("Super admin access required"));
  }

  next();
};
