import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import * as authService from "./auth.service";
import { UnauthorizedError } from "../../errors/RequestError";
import { REFRESH_TOKEN_COOKIE_NAME } from "../../constants";
import { env } from "../../config/env";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? ("strict" as const) : ("lax" as const),
  path: "/api/v1/auth",
  maxAge: env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
};

export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await authService.registerUser(req.body);
    res
      .status(201)
      .json(success(user, { message: "User registered successfully" }));
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.loginUser(req.body, {
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      result.refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );

    res.status(200).json(
      success(
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        { message: "User logged in successfully" },
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const refreshController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedError("No refresh token provided");
    }

    const result = await authService.refreshAccessToken(refreshToken, {
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      result.refreshToken,
      REFRESH_COOKIE_OPTIONS,
    );

    res.status(200).json(
      success(
        {
          accessToken: result.accessToken,
        },
        { message: "Token refreshed successfully" },
      ),
    );
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (refreshToken) {
      await authService.logoutSession(refreshToken);
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? ("strict" as const) : ("lax" as const),
      path: "/api/v1/auth",
    });

    res.status(200).json(success(null, { message: "Logged out successfully" }));
  } catch (error) {
    next(error);
  }
};

export const logoutAllController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("User ID not found in request");
    }

    await authService.logoutAllSessions(userId);

    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? ("strict" as const) : ("lax" as const),
      path: "/api/v1/auth",
    });

    res
      .status(200)
      .json(success(null, { message: "All sessions logged out successfully" }));
  } catch (error) {
    next(error);
  }
};

export const getCurrentUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("User ID not found in request");
    }
    const user = await authService.getCurrentUser(userId);

    res.status(200).json(success(user));
  } catch (error) {
    next(error);
  }
};
