import { db } from "../../database";
import {
  CreateMemberShipInput,
  MembershipContext,
  MemberShip,
  Member,
  MemberFilters,
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

export const getOrganizationMembers = async (
  organizationId: string,
  filters: MemberFilters = {},
): Promise<Member[]> => {
  let query = db
    .selectFrom("memberships")
    .innerJoin("users", "users.id", "memberships.user_id")
    .innerJoin("user_emails", "user_emails.user_id", "users.id")
    .innerJoin("roles", "roles.id", "memberships.role_id")
    .where("memberships.organization_id", "=", organizationId)
    .where("users.deleted_at", "is", null)
    .where("user_emails.is_primary", "=", true)
    .select([
      "users.id as id",
      "user_emails.email as email",
      "users.display_name as display_name",
      "roles.id as role_id",
      "roles.name as role_name",
      "memberships.status as status",
      "memberships.created_at as created_at",
      "memberships.updated_at as updated_at",
    ]);

  if (filters.role) {
    query = query.where("roles.name", "=", filters.role);
  }

  if (filters.status) {
    query = query.where("memberships.status", "=", filters.status);
  }

  const members = await query.execute();

  return members;
};

const MEMBERSHIP_COLUMNS = [
  "id",
  "user_id",
  "organization_id",
  "role_id",
  "status",
  "created_at",
  "updated_at",
] as const;

export const getOrganizationMembership = async (
  organizationId: string,
  membershipId: string,
): Promise<MemberShip | null> => {
  const membership = await db
    .selectFrom("memberships")
    .where("id", "=", membershipId)
    .where("organization_id", "=", organizationId)
    .select(MEMBERSHIP_COLUMNS)
    .executeTakeFirst();

  return membership ?? null;
};

export const updateMemberRole = async (
  organizationId: string,
  membershipId: string,
  newRoleId: string,
): Promise<MemberShip | null> => {
  const updatedMember = await db
    .updateTable("memberships")
    .set({ role_id: newRoleId })
    .where("id", "=", membershipId)
    .where("organization_id", "=", organizationId)
    .returning(MEMBERSHIP_COLUMNS)
    .executeTakeFirst();

  return updatedMember ?? null;
};

export const updateMemberStatus = async (
  organizationId: string,
  membershipId: string,
  newStatus: MemberShip["status"],
): Promise<MemberShip | null> => {
  const updatedMember = await db
    .updateTable("memberships")
    .set({ status: newStatus })
    .where("id", "=", membershipId)
    .where("organization_id", "=", organizationId)
    .returning(MEMBERSHIP_COLUMNS)
    .executeTakeFirst();

  return updatedMember ?? null;
};

export const deleteMembership = async (
  organizationId: string,
  membershipId: string,
): Promise<boolean> => {
  const deleted = await db
    .deleteFrom("memberships")
    .where("id", "=", membershipId)
    .where("organization_id", "=", organizationId)
    .returning("id")
    .executeTakeFirst();

  return deleted !== undefined;
};

/**
 * Removes the owner's membership and hands ownership to the longest-standing
 * active admin in one transaction, so the organization is never left without
 * an owner. Returns false, changing nothing, when there is no admin to promote.
 */
export const transferOwnershipAndLeave = async (
  organizationId: string,
  ownerMembershipId: string,
  ownerRoleId: string,
  adminRoleId: string,
): Promise<boolean> => {
  return await db.transaction().execute(async (trx) => {
    const successor = await trx
      .selectFrom("memberships")
      .where("organization_id", "=", organizationId)
      .where("role_id", "=", adminRoleId)
      .where("status", "=", "ACTIVE")
      .where("id", "!=", ownerMembershipId)
      .orderBy("created_at", "asc")
      .select("id")
      .limit(1)
      .forUpdate()
      .executeTakeFirst();

    if (!successor) {
      return false;
    }

    await trx
      .updateTable("memberships")
      .set({ role_id: ownerRoleId })
      .where("id", "=", successor.id)
      .execute();

    await trx
      .deleteFrom("memberships")
      .where("id", "=", ownerMembershipId)
      .where("organization_id", "=", organizationId)
      .execute();

    return true;
  });
};
