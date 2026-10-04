import { AsyncLocalStorage } from "node:async_hooks";
import { Request, Response, NextFunction } from "express";

type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Makes the caller's IP and user agent reachable from service code, so the
 * audit writer can record them without every service taking `req`.
 */
export const requestContext = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  storage.run(
    {
      ipAddress: req.ip ?? null,
      userAgent: req.headers["user-agent"]?.slice(0, 255) ?? null,
    },
    next,
  );
};

export const getRequestContext = (): RequestContext =>
  storage.getStore() ?? { ipAddress: null, userAgent: null };
