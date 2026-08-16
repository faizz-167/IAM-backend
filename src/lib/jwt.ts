import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError } from "../errors/RequestError";

interface JwtPayload {
  userId: string;
  type: "access";
}

const OPTIONS: jwt.SignOptions = {
  expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  algorithm: "HS256",
};

export function signInToken(userId: string): string {
  const payload: JwtPayload = {
    userId,
    type: "access",
  };
  return jwt.sign(payload, env.jwtSecret, OPTIONS);
}

export function verifyToken(token: string): JwtPayload {
  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ["HS256"],
    }) as JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.userId !== "string" ||
    decoded.type !== "access"
  ) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  return {
    userId: decoded.userId,
    type: decoded.type,
  };
}
