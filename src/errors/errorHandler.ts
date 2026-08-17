import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { RequestError } from "./RequestError";
import { fail, failWith, fieldErrorsToApiErrors } from "../lib/response";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof RequestError) {
    if (err.errors) {
      return res
        .status(err.statusCode)
        .json(failWith(fieldErrorsToApiErrors(err.errors)));
    }

    return res.status(err.statusCode).json(fail(err.message));
  }

  logger.error(err);

  return res.status(500).json(fail("Internal Server Error"));
}
