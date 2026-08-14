import express, { urlencoded, type Express } from "express";
import cors from "cors";
import { errorHandler } from "./errors/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { apiRouter } from "./routes";
import { httpLogger } from "./lib/httpLogger";
import cookieParser from "cookie-parser";
import { env } from "./config/env";

export const createApp = (): Express => {
  const app = express();
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );

  app.use(httpLogger);
  app.use(express.json());
  app.use(urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use("/api/v1", apiRouter);
  app.use(errorHandler);
  app.use(notFoundHandler);

  return app;
};
