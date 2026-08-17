import { DatabaseError } from "pg";
import { db } from "../../database";
import { CreateOrganizationInput } from "./organizations.schema";
import { Organization, OrganizationStatus } from "./organizations.types";
import { ConflictError, InternalServerError } from "../../errors/RequestError";
import { PG_UNIQUE_VIOLATION } from "../../constants";
import { sql } from "kysely";

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

export const createOrganization = async (
  organization: CreateOrganizationInput,
  userId: string,
  roleId: string,
): Promise<Organization> => {
  try {
    const newOrganization = await db.transaction().execute(async (trx) => {
      const organizationRecord = await trx
        .insertInto("organizations")
        .values({
          name: organization.name,
          slug: sql`lower(${organization.slug})`,
          created_by: userId,
        })
        .returning(ORG_COLUMNS)
        .executeTakeFirstOrThrow();

      await trx
        .insertInto("memberships")
        .values({
          organization_id: organizationRecord.id,
          user_id: userId,
          role_id: roleId,
        })
        .executeTakeFirstOrThrow();

      return organizationRecord;
    });

    return newOrganization;
  } catch (error) {
    if (error instanceof DatabaseError && error.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError(
        "Organization with the same name or slug already exists",
      );
    }
    throw new InternalServerError("Failed to create organization");
  }
};
