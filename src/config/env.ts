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
  port: process.env.PORT ?? 6000,
  isProduction: (process.env.NODE_ENV ?? "development") === "production",
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: process.env.LOG_LEVEL ?? "info",
  jwtSecret: checkRequiredEnvVars("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  databaseUrl: checkRequiredEnvVars("DATABASE_URL"),
  redisUrl: checkRequiredEnvVars("REDIS_URL"),
};
