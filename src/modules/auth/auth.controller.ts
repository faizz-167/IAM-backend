import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import * as authService from "./auth.service";

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
