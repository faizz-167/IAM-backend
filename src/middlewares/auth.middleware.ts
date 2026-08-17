import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/RequestError";
import { verifyToken } from "../lib/jwt";
import { getUserAuthState } from "../modules/users/user.repo";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Invalid or missing authorization header");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const { userId } = verifyToken(token);

    const user = await getUserAuthState(userId);
    if (!user) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    if (user.status !== "ACTIVE" && user.status !== "PENDING") {
      throw new ForbiddenError("Account is not active");
    }

    req.userId = user.id;
    req.isSuperAdmin = user.is_super_admin;

    next();
  } catch (error) {
    next(error);
  }
};
