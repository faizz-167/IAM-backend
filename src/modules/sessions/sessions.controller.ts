import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import * as sessionsService from "./sessions.service";

export const listMySessionsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessions = await sessionsService.listMySessions(
      req.userId as string,
      req.sessionId as string,
    );
    res.status(200).json(success(sessions));
  } catch (error) {
    next(error);
  }
};

export const revokeMySessionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await sessionsService.revokeMySession(
      req.userId as string,
      req.params.sessionId as string,
    );
    res.status(200).json(success(null, { message: "Session revoked" }));
  } catch (error) {
    next(error);
  }
};
