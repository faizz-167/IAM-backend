import crypto from "node:crypto";

const REFRESH_TOKEN_BYTES = 64;

/**
 * Generate a cryptographically-random opaque refresh token.
 * Returns a 128-char hex string (64 bytes).
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
}

/**
 * One-way SHA-256 hash of a token for safe storage in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
