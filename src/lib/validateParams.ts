import type { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../errors/RequestError";
import { toFieldErrors } from "./validationIssues";

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return next(new ValidationError(toFieldErrors(result.error, "params")));
    }

    Object.assign(req.params, result.data);
    next();
  };
}
