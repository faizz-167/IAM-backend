import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import { AuthContext } from "../auth/auth.types";
import * as invitationsService from "./invitations.service";
import { ListInvitationsQuery } from "./invitations.schema";

export const createInvitationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authContext = req.authContext as AuthContext;
    const invitation = await invitationsService.createInvitation(
      authContext,
      req.body,
    );
    res.status(201).json(
      success(invitation, {
        message: "Invitation created successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const listInvitationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authContext = req.authContext as AuthContext;
    const filters = req.validatedQuery as ListInvitationsQuery;
    const invitations = await invitationsService.listInvitations(
      authContext,
      filters,
    );
    res.status(200).json(success(invitations));
  } catch (error) {
    next(error);
  }
};

export const resendInvitationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authContext = req.authContext as AuthContext;
    const invitationId = req.params.invitationId as string;
    const invitation = await invitationsService.resendInvitation(
      authContext,
      invitationId,
    );
    res.status(200).json(
      success(invitation, {
        message: "Invitation resent successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const revokeInvitationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authContext = req.authContext as AuthContext;
    const invitationId = req.params.invitationId as string;
    await invitationsService.revokeInvitation(authContext, invitationId);
    res.status(200).json(
      success(null, {
        message: "Invitation revoked successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const previewInvitationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.params.token as string;
    const preview = await invitationsService.previewInvitation(token);
    res.status(200).json(success(preview));
  } catch (error) {
    next(error);
  }
};

export const acceptInvitationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string;
    const token = req.params.token as string;
    const membership = await invitationsService.acceptInvitation(userId, token);
    res.status(201).json(
      success(membership, {
        message: "Invitation accepted successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const declineInvitationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string;
    const token = req.params.token as string;
    await invitationsService.declineInvitation(userId, token);
    res.status(200).json(
      success(null, {
        message: "Invitation declined successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};
