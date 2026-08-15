import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/RequestError";
import { verifyToken } from "../lib/jwt";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new UnauthorizedError("Invalid or missing authorization header"),
    );
  }

  const token = authHeader.slice("Bearer ".length).trim();
  req.userId = verifyToken(token).userId;

  next();
};
