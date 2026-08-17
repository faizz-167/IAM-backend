import { Organization, PublicOrganization } from "./organizations.types";

export const convertToPublicOrganization = (
  organization: Organization,
  roleName: string,
  createdByName: string | null,
): PublicOrganization => {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    status: organization.status,
    created_by: organization.created_by,
    created_by_name: createdByName,
    role_name: roleName,
    created_at: organization.created_at,
    updated_at: organization.updated_at,
  };
};
