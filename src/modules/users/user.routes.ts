import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { authLimiter } from "../../middlewares/rateLimit";
import { validateBody } from "../../lib/validateBody";
import {
  changePasswordSchema,
  deleteMeSchema,
  updateMeSchema,
} from "./user.schema";
import * as userController from "./user.controller";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.patch(
  "/me",
  validateBody(updateMeSchema),
  userController.updateMeController,
);

usersRouter.post(
  "/me/password",
  authLimiter,
  validateBody(changePasswordSchema),
  userController.changePasswordController,
);

usersRouter.delete(
  "/me",
  authLimiter,
  validateBody(deleteMeSchema),
  userController.deleteMeController,
);
