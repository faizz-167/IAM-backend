import { db } from "../../database";
import {
  CreateMemberShipInput,
  MembershipContext,
  MemberShip,
} from "./members.types";

export const createMemberShip = async (
  data: CreateMemberShipInput,
): Promise<MemberShip> => {
  const newMemberShip = await db
    .insertInto("memberships")
    .values(data)
    .returning([
      "id",
      "user_id",
      "organization_id",
      "role_id",
      "status",
      "created_at",
      "updated_at",
    ])
    .executeTakeFirstOrThrow();

  return newMemberShip;
};

export const getMembershipsByUserId = async (userId: string) => {
  return await db
    .selectFrom("memberships")
    .where("user_id", "=", userId)
    .select([
      "id",
      "user_id",
      "organization_id",
      "role_id",
      "status",
      "created_at",
      "updated_at",
    ])
    .execute();
};

export const getMembershipContext = async (
  userId: string,
  organizationId: string,
): Promise<MembershipContext | null> => {
  const context = await db
    .selectFrom("memberships")
    .innerJoin(
      "organizations",
      "organizations.id",
      "memberships.organization_id",
    )
    .innerJoin("roles", "roles.id", "memberships.role_id")
    .where("memberships.user_id", "=", userId)
    .where("memberships.organization_id", "=", organizationId)
    .where("organizations.deleted_at", "is", null)
    .select([
      "memberships.id as membership_id",
      "memberships.status as membership_status",
      "organizations.status as organization_status",
      "roles.id as role_id",
      "roles.name as role_name",
    ])
    .executeTakeFirst();

  return context ?? null;
};
