import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import * as authService from "./auth.service";
import { UnauthorizedError } from "../../errors/RequestError";

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
    const user = await authService.loginUser(req.body);
    res
      .status(200)
      .json(success(user, { message: "User logged in successfully" }));
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
