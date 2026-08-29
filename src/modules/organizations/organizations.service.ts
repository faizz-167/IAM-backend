import {
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../../errors/RequestError";
import { getSystemRoleByName } from "../roles/roles.repo";
import { getUserById } from "../users/user.repo";
import * as organizationsRepo from "./organizations.repo";
import { CreateOrganizationInput } from "./organizations.schema";
import { Organization, PublicOrganization } from "./organizations.types";
import { convertToPublicOrganization } from "./organizations.utils";

export const listOrganizations = async (): Promise<Organization[]> => {
  return await organizationsRepo.getAllOrganizations();
};

export const updateOrganizationStatus = async (
  organizationId: string,
  status: Organization["status"],
): Promise<Organization> => {
  const organization = await organizationsRepo.updateOrganizationStatus(
    organizationId,
    status,
  );

  if (!organization) {
    throw new NotFoundError("Organization");
  }

  return organization;
};

export const createOrganization = async (
  organization: CreateOrganizationInput,
  userId: string,
): Promise<PublicOrganization> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  if (user.status !== "ACTIVE") {
    throw new UnauthorizedError(
      "Verify your account before creating an organization",
    );
  }
  const role = await getSystemRoleByName("OWNER");

  if (!role) {
    throw new InternalServerError("Unable to create organization");
  }

  const newOrganization = await organizationsRepo.createOrganization(
    organization,
    userId,
    role.id,
  );

  return convertToPublicOrganization(
    newOrganization,
    role.name,
    user.display_name,
  );
};

export const listCurrentUSerOrganization = async (
  userId: string,
): Promise<PublicOrganization[]> => {
  const organizations =
    await organizationsRepo.getOrganizationsByUserId(userId);

  return organizations;
};

export const getOrganization = async (
  organizationId: string,
): Promise<Organization> => {
  const organization =
    await organizationsRepo.getOrganizationById(organizationId);

  if (!organization) {
    throw new NotFoundError("Organization");
  }

  return organization;
};
