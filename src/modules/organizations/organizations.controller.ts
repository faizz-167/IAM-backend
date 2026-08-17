import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import * as organizationsService from "./organizations.service";

export const listOrganizationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organizations = await organizationsService.listOrganizations();
    res.status(200).json(success(organizations));
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organization = await organizationsService.updateOrganizationStatus(
      req.params.id as string,
      req.body.status,
    );
    res
      .status(200)
      .json(
        success(organization, {
          message: "Organization status updated successfully",
        }),
      );
  } catch (error) {
    next(error);
  }
};
