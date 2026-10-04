import { Request, Response, NextFunction } from "express";
import { success } from "../../lib/response";
import * as organizationsService from "./organizations.service";
import {
  ListOrganizationMembersQuery,
  ListOrganizationsQuery,
} from "./organizations.schema";

export const listOrganizationsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filters = req.validatedQuery as ListOrganizationsQuery;
    const result = await organizationsService.listOrganizations(filters);
    res
      .status(200)
      .json(success(result.items, { pagination: result.pagination }));
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
      req.params.orgId as string,
      req.body.status,
      req.userId as string,
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

export const getOrganizationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.orgId as string;
    const organization = await organizationsService.getOrganization(orgId);
    res.status(200).json(success(organization));
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.orgId as string;
    const organization = await organizationsService.updateOrganization(
      orgId,
      req.body,
      req.userId as string,
    );
    res.status(200).json(
      success(organization, {
        message: "Organization updated successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const deleteOrganizationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.orgId as string;
    await organizationsService.deleteOrganization(orgId, req.userId as string);
    res.status(200).json(
      success(null, {
        message: "Organization deleted successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const createRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.orgId as string;
    const newRole = await organizationsService.createRole(
      orgId,
      req.body,
      req.authContext!.permissions,
      req.userId as string,
    );
    res.status(201).json(
      success(newRole, {
        message: "Role created successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const listRolesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.orgId as string;
    const roles = await organizationsService.listRoles(orgId);
    res.status(200).json(success(roles));
  } catch (error) {
    next(error);
  }
};

export const listRoleByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.orgId as string;
    const roleId = req.params.roleId as string;
    const role = await organizationsService.getRoleById(orgId, roleId);
    res.status(200).json(success(role));
  } catch (error) {
    next(error);
  }
};

export const updateRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.orgId as string;
    const roleId = req.params.roleId as string;
    const updatedRole = await organizationsService.updateRole(
      orgId,
      roleId,
      req.body,
      req.userId as string,
    );
    res.status(200).json(
      success(updatedRole, {
        message: "Role updated successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const deleteRoleController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.orgId as string;
    const roleId = req.params.roleId as string;
    await organizationsService.deleteRole(orgId, roleId, req.userId as string);
    res.status(200).json(
      success(null, {
        message: "Role deleted successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const updateRolePermissionsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.orgId as string;
    const roleId = req.params.roleId as string;
    const updatedRole = await organizationsService.updateRolePermissions(
      orgId,
      roleId,
      req.body.permissions,
      req.authContext!.permissions,
      req.userId as string,
    );
    res.status(200).json(
      success(updatedRole, {
        message: "Role permissions updated successfully",
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const listOrganizationMembersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orgId = req.orgId as string;
    const { page, limit, ...filters } =
      req.validatedQuery as ListOrganizationMembersQuery;
    const result = await organizationsService.listOrganizationMembers(
      orgId,
      filters,
      { page, limit },
    );
    res
      .status(200)
      .json(success(result.items, { pagination: result.pagination }));
  } catch (error) {
    next(error);
  }
};
