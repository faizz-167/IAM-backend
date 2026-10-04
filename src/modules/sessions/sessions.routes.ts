import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateParams } from "../../lib/validateParams";
import { sessionIdParamSchema } from "./sessions.schema";
import * as sessionsController from "./sessions.controller";

export const sessionsRouter = Router();

sessionsRouter.use(authenticate);

sessionsRouter.get("/", sessionsController.listMySessionsController);

sessionsRouter.delete(
  "/:sessionId",
  validateParams(sessionIdParamSchema),
  sessionsController.revokeMySessionController,
);
