import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ForbiddenError } from "../errors/RequestError";

interface JwtPayload {
  userId: string;
  type: "access";
}

export function signInToken(userId: string): string {
  const payload: JwtPayload = {
    userId,
    type: "access",
  };
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"],
  }) as JwtPayload;

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.userId !== "string" ||
    decoded.type !== "access"
  ) {
    throw new ForbiddenError("Invalid JWT token.");
  }

  return {
    userId: decoded.userId,
    type: decoded.type,
  };
}
