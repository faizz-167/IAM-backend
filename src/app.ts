import express, { urlencoded } from "express";
import cors from "cors";
import { errorHandler } from "./errors/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(urlencoded({ extended: true }));

  app.use(errorHandler);
  app.use(notFoundHandler);

  return app;
};
