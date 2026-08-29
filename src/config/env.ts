import dotenv from "dotenv";

dotenv.config();

function checkRequiredEnvVars(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function trustProxyEnv(): boolean | number | string {
  const raw = process.env.TRUST_PROXY;
  if (raw === undefined || raw.trim() === "") {
    return false;
  }

  if (raw === "true") return true;
  if (raw === "false") return false;

  const hops = Number(raw);
  return Number.isInteger(hops) ? hops : raw;
}

/**
 * Turns a `jsonwebtoken` expiry string ("15m", "1h", "900") into seconds.
 *
 * The access-token denylist needs the lifetime as a number so a revoked
 * session's Redis entry can expire exactly when the token it blocks does.
 */
function durationSeconds(raw: string, key: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(raw.trim());
  if (!match) {
    throw new Error(
      `Environment variable ${key} must be a duration like "15m", got "${raw}"`,
    );
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? "s";
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1;

  return amount * multiplier;
}

function numberEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got "${raw}"`);
  }

  return parsed;
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "15m";

export const env = {
  // Not 6000: browsers block it as an unsafe port (ERR_UNSAFE_PORT).
  port: numberEnv("PORT", 3000),
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: process.env.LOG_LEVEL ?? "info",
  jwtSecret: checkRequiredEnvVars("JWT_SECRET"),
  jwtExpiresIn,
  jwtExpiresInSeconds: durationSeconds(jwtExpiresIn, "JWT_EXPIRES_IN"),
  databaseUrl: checkRequiredEnvVars("DATABASE_URL"),
  logQueries: process.env.LOG_QUERIES ?? "false",
  redisUrl: checkRequiredEnvVars("REDIS_URL"),
  refreshTokenExpiresInDays: numberEnv("REFRESH_TOKEN_EXPIRES_IN_DAYS", 7),
  trustProxy: trustProxyEnv(),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  smtp: {
    host: checkRequiredEnvVars("SMTP_HOST"),
    port: numberEnv("SMTP_PORT", 587),
    secure: process.env.SMTP_SECURE === "true",
    user: checkRequiredEnvVars("SMTP_USER"),
    pass: checkRequiredEnvVars("SMTP_PASS"),
    from: checkRequiredEnvVars("SMTP_FROM"),
  },
  emailVerificationTtlMinutes: numberEnv("EMAIL_VERIFICATION_TTL_MINUTES", 15),
  shutdownTimeoutMs: numberEnv("SHUTDOWN_TIMEOUT_MS", 10_000),
};
