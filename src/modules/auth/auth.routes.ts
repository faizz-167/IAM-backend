import { Router } from "express";
import { validateBody } from "../../lib/validateBody";
import { emailVerifySchema, loginSchema, registerSchema } from "./auth.schema";
import * as authController from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import {
  authLimiter,
  otpLimiter,
  registerLimiter,
} from "../../middlewares/rateLimit";

export const authRouter = Router();

authRouter.post(
  "/register",
  registerLimiter,
  validateBody(registerSchema),
  authController.registerController,
);

authRouter.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  authController.loginController,
);

authRouter.post("/refresh", authLimiter, authController.refreshController);

authRouter.post("/logout", authController.logoutController);

authRouter.post(
  "/logout-all",
  authenticate,
  authController.logoutAllController,
);

authRouter.get("/me", authenticate, authController.getCurrentUserController);

authRouter.post(
  "/email-verify",
  otpLimiter,
  authenticate,
  authController.requestEmailController,
);

authRouter.post(
  "/verify-email",
  otpLimiter,
  authenticate,
  validateBody(emailVerifySchema),
  authController.verifyEmailController,
);
