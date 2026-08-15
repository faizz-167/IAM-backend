import { Request, Response } from "express";
import { fail } from "../lib/response";

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json(fail("Route not Found"));
};
