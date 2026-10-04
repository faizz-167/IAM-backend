import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import { REFRESH_TOKEN_COOKIE_NAME } from "../../constants";
import { env } from "../../config/env";
import * as userService from "./user.service";

const LOGOUT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? ("strict" as const) : ("lax" as const),
  path: "/api/v1/auth",
};

export const updateMeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await userService.updateMe(req.userId as string, req.body);
    res
      .status(200)
      .json(success(user, { message: "Profile updated successfully" }));
  } catch (error) {
    next(error);
  }
};

export const changePasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await userService.changePassword(
      req.userId as string,
      req.sessionId as string,
      req.body,
    );
    res
      .status(200)
      .json(success(null, { message: "Password changed successfully" }));
  } catch (error) {
    next(error);
  }
};

export const deleteMeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await userService.deleteMe(req.userId as string, req.body.password);
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, LOGOUT_COOKIE_OPTIONS);
    res
      .status(200)
      .json(success(null, { message: "Account deleted successfully" }));
  } catch (error) {
    next(error);
  }
};
