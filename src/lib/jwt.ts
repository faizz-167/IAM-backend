import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UnauthorizedError } from "../errors/RequestError";

interface JwtPayload {
  userId: string;
  sessionId: string;
  type: "access";
}

const OPTIONS: jwt.SignOptions = {
  expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  algorithm: "HS256",
};

/**
 * The session id travels in the token so `authenticate` can check it against
 * the revocation denylist. Without it a logout could not reach tokens that were
 * already handed out.
 */
export function signInToken(userId: string, sessionId: string): string {
  const payload: JwtPayload = {
    userId,
    sessionId,
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
    typeof decoded.sessionId !== "string" ||
    decoded.type !== "access"
  ) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  return {
    userId: decoded.userId,
    sessionId: decoded.sessionId,
    type: decoded.type,
  };
}
