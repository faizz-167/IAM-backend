import { NotFoundError } from "../../errors/RequestError";
import * as organizationsRepo from "./organizations.repo";
import { Organization } from "./organizations.types";

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
