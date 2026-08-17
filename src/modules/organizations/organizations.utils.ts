import { Organization, PublicOrganization } from "./organizations.types";

export const convertToPublicOrganization = (
  organization: Organization,
  roleOfCreator: string,
  createdBy: string,
): PublicOrganization => {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    status: organization.status,
    role_of_creator: roleOfCreator,
    created_by: createdBy,
    created_at: organization.created_at,
    updated_at: organization.updated_at,
  };
};
