import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/RequestError";
import { verifyToken } from "../lib/jwt";
import { isAccessDenied } from "../lib/accessTokenDenylist";
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
    const { userId, sessionId } = verifyToken(token);

    // A signature alone is not enough: logout revokes the session behind the
    // token, and that revocation has to bite before the token's own expiry.
    if (await isAccessDenied(sessionId)) {
      throw new UnauthorizedError("Session has been revoked");
    }

    const user = await getUserAuthState(userId);
    if (!user) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    if (user.status !== "ACTIVE" && user.status !== "PENDING") {
      throw new ForbiddenError("Account is not active");
    }

    req.userId = user.id;
    req.sessionId = sessionId;
    req.isSuperAdmin = user.is_super_admin;

    next();
  } catch (error) {
    next(error);
  }
};
