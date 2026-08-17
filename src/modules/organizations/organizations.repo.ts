import { db } from "../../database";
import { OrganizationStatus } from "./organizations.types";

const ORG_COLUMNS = [
  "id",
  "name",
  "slug",
  "status",
  "created_by",
  "created_at",
  "updated_at",
] as const;

export const getAllOrganizations = async () => {
  return await db
    .selectFrom("organizations")
    .where("deleted_at", "is", null)
    .select(ORG_COLUMNS)
    .orderBy("created_at", "asc")
    .execute();
};

export const getOrganizationById = async (organizationId: string) => {
  const organization = await db
    .selectFrom("organizations")
    .where("id", "=", organizationId)
    .where("deleted_at", "is", null)
    .select(ORG_COLUMNS)
    .executeTakeFirst();

  return organization ?? null;
};

export const updateOrganizationStatus = async (
  organizationId: string,
  status: OrganizationStatus,
) => {
  const organization = await db
    .updateTable("organizations")
    .set({ status })
    .where("id", "=", organizationId)
    .where("deleted_at", "is", null)
    .returning(ORG_COLUMNS)
    .executeTakeFirst();

  return organization ?? null;
};
