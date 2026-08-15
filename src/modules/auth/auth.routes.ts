import { Router } from "express";
import { validateBody } from "../../lib/validateBody";
import { loginSchema, registerSchema } from "./auth.schema";
import * as authController from "./auth.controller";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  authController.registerController,
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  authController.loginController,
);
