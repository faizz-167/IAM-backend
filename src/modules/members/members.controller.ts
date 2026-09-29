import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import * as membersService from "../members/members.service";
import { AuthContext } from "../auth/auth.types";

export const updateMemberRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const membershipId = req.params.membershipId as string;
    const authContext = req.authContext as AuthContext;
    const updatedMember = await membersService.updateMemberRole(
      authContext,
      membershipId,
      req.body.role_id,
    );
    res.status(200).json(
      success(updatedMember, {
        message: "Member role updated successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const updateMemberStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const membershipId = req.params.membershipId as string;
    const authContext = req.authContext as AuthContext;
    const updatedMember = await membersService.updateMemberStatus(
      authContext,
      membershipId,
      req.body.status,
    );
    res.status(200).json(
      success(updatedMember, {
        message: "Member status updated successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const deleteMembershipController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const membershipId = req.params.membershipId as string;
    const authContext = req.authContext as AuthContext;
    await membersService.deleteMembership(authContext, membershipId);
    res.status(200).json(
      success(null, {
        message: "Member deleted successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const deleteMyMembershipController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authContext = req.authContext as AuthContext;
    await membersService.deleteMyMembership(authContext);
    res.status(200).json(
      success(null, {
        message: "Membership deleted successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};
