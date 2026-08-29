import { Request, Response, NextFunction } from "express";
import { authorize } from "../modules/auth/authorize";
import { PermissionName } from "../modules/permissions/permission.catalogue";

export const requirePermission = (permission: PermissionName) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      authorize(req.authContext, permission);
      next();
    } catch (error) {
      next(error);
    }
  };
};
