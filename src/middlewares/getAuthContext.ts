import { Request, Response, NextFunction } from "express";
import { InternalServerError } from "../errors/RequestError";
import { loadAuthContext } from "../modules/auth/authContext.service";

export const getAuthContext = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    const orgId = req.orgId;

    if (!userId || !orgId) {
      return next(
        new InternalServerError(
          "User id or organization id is missing in the request context",
        ),
      );
    }

    req.authContext = await loadAuthContext(userId, orgId);

    next();
  } catch (error) {
    next(error);
  }
};
