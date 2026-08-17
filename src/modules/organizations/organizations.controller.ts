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
    res.status(200).json(
      success(organization, {
        message: "Organization status updated successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const createOrganizationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string;

    const organization = await organizationsService.createOrganization(
      req.body,
      userId,
    );
    res.status(201).json(
      success(organization, {
        message: "Organization created successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const getMyOrganizationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId as string;
    const organizations =
      await organizationsService.listCurrentUSerOrganization(userId);
    res.status(200).json(success(organizations));
  } catch (error) {
    next(error);
  }
};
