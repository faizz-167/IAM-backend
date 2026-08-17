import express, { urlencoded, type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./errors/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { apiRouter } from "./routes";
import { httpLogger } from "./lib/httpLogger";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { globalLimiter } from "./middlewares/rateLimit";

export const createApp = (): Express => {
  const app = express();

  // Must match the real deployment topology: rate limiting keys on req.ip.
  app.set("trust proxy", env.trustProxy);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );

  app.use(httpLogger);
  app.use(express.json({ limit: "100kb" }));
  app.use(urlencoded({ extended: true, limit: "100kb" }));
  app.use(cookieParser());

  app.use(globalLimiter);
  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
