import dotenv from "dotenv";

dotenv.config();

function checkRequiredEnvVars(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT) ?? 6000,
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: process.env.LOG_LEVEL ?? "info",
  jwtSecret: checkRequiredEnvVars("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  databaseUrl: checkRequiredEnvVars("DATABASE_URL"),
  logQueries: process.env.LOG_QUERIES ?? "false",
  redisUrl: checkRequiredEnvVars("REDIS_URL"),
  refreshTokenExpiresInDays: Number(
    process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? "7",
  ),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  smtp: {
    host: checkRequiredEnvVars("SMTP_HOST"),
    port: Number(checkRequiredEnvVars("SMTP_PORT")),
    secure: process.env.SMTP_SECURE === "true",
    user: checkRequiredEnvVars("SMTP_USER"),
    pass: checkRequiredEnvVars("SMTP_PASS"),
    from: checkRequiredEnvVars("SMTP_FROM"),
  },
  emailVerificationTtlMinutes: Number(
    process.env.EMAIL_VERIFICATION_TTL_MINUTES ?? "15",
  ),
};
