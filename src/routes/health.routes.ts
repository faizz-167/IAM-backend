import { Router } from "express";
import { success } from "../lib/response";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.status(200).json(success("Service is healthy"));
});
