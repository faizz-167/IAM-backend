import { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";
import { RequestError } from "../errors/RequestError";
import { fail } from "../lib/response";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof RequestError) {
    res.status(err.statusCode).json(fail(err.message));

    return;
  }
  logger.error(err, "Unhandled error occurred");
  res.status(500).json(fail("Internal Server Error"));
};
