import { Request, Response, NextFunction } from "express";
import { InternalServerError } from "../errors/RequestError";

export const setOrgId = (req: Request, _res: Response, next: NextFunction) => {
  const orgId = req.params.orgId as string | undefined;

  if (!orgId) {
    return next(
      new InternalServerError(
        "Organization id is missing in the request params",
      ),
    );
  }

  req.orgId = orgId;
  next();
};
