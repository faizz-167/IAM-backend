import { sql } from "kysely";
import { DatabaseError } from "pg";
import { db } from "../../database";
import { PG_UNIQUE_VIOLATION } from "../../constants";
import { ConflictError } from "../../errors/RequestError";
import {
  CreateInvitationRecord,
  Invitation,
  InvitationByToken,
  InvitationFilters,
  InvitationWithRole,
} from "./invitations.types";

const INVITATION_COLUMNS = [
  "id",
  "organization_id",
  "email",
  "role_id",
  "status",
  "invited_by",
  "created_at",
  "expires_at",
] as const;

/**
 * The database does not enforce `expires_at`, so every read path flips overdue
 * PENDING rows to EXPIRED first. Scoped to one email when given, otherwise to
 * the whole organization.
 */
export const expireStaleInvitations = async (
  organizationId: string,
  email?: string,
): Promise<void> => {
  let query = db
    .updateTable("invitations")
    .set({ status: "EXPIRED" })
    .where("organization_id", "=", organizationId)
    .where("status", "=", "PENDING")
    .where("expires_at", "<=", sql<Date>`now()`);

  if (email) {
    query = query.where("email", "=", email);
  }

  await query.execute();
};

export const isEmailMemberOfOrganization = async (
  organizationId: string,
  email: string,
): Promise<boolean> => {
  const membership = await db
    .selectFrom("memberships")
    .innerJoin("user_emails", "user_emails.user_id", "memberships.user_id")
    .innerJoin("users", "users.id", "memberships.user_id")
    .where("memberships.organization_id", "=", organizationId)
    .where(sql`lower(user_emails.email)`, "=", email)
    .where("users.deleted_at", "is", null)
    .select("memberships.id")
    .executeTakeFirst();

  return membership !== undefined;
};

export const createInvitation = async (
  data: CreateInvitationRecord,
): Promise<Invitation> => {
  try {
    return await db
      .insertInto("invitations")
      .values({
        organization_id: data.organizationId,
        email: data.email,
        role_id: data.roleId,
        invited_by: data.invitedBy,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt.toISOString(),
      })
      .returning(INVITATION_COLUMNS)
      .executeTakeFirstOrThrow();
  } catch (error) {
    if (error instanceof DatabaseError && error.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError(
        "A pending invitation already exists for this email",
      );
    }

    throw error;
  }
};

export const deleteInvitation = async (invitationId: string): Promise<void> => {
  await db.deleteFrom("invitations").where("id", "=", invitationId).execute();
};

export const listInvitations = async (
  organizationId: string,
  filters: InvitationFilters = {},
): Promise<InvitationWithRole[]> => {
  let query = db
    .selectFrom("invitations")
    .innerJoin("roles", "roles.id", "invitations.role_id")
    .where("invitations.organization_id", "=", organizationId)
    .select([
      "invitations.id",
      "invitations.organization_id",
      "invitations.email",
      "invitations.role_id",
      "roles.name as role_name",
      "invitations.status",
      "invitations.invited_by",
      "invitations.created_at",
      "invitations.expires_at",
    ])
    .orderBy("invitations.created_at", "desc");

  if (filters.status) {
    query = query.where("invitations.status", "=", filters.status);
  }

  return await query.execute();
};

export const getOrganizationInvitation = async (
  organizationId: string,
  invitationId: string,
): Promise<Invitation | null> => {
  const invitation = await db
    .selectFrom("invitations")
    .where("id", "=", invitationId)
    .where("organization_id", "=", organizationId)
    .select(INVITATION_COLUMNS)
    .executeTakeFirst();

  return invitation ?? null;
};

/**
 * Rotates the token and restarts the clock. Only PENDING or EXPIRED rows can be
 * reissued; an accepted, rejected, or revoked invitation stays closed.
 */
export const reissueInvitation = async (
  organizationId: string,
  invitationId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<Invitation | null> => {
  try {
    const invitation = await db
      .updateTable("invitations")
      .set({
        status: "PENDING",
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      })
      .where("id", "=", invitationId)
      .where("organization_id", "=", organizationId)
      .where("status", "in", ["PENDING", "EXPIRED"])
      .returning(INVITATION_COLUMNS)
      .executeTakeFirst();

    return invitation ?? null;
  } catch (error) {
    // Reopening an EXPIRED row collides with a newer PENDING one for the email.
    if (error instanceof DatabaseError && error.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError(
        "A pending invitation already exists for this email",
      );
    }

    throw error;
  }
};

export const revokeInvitation = async (
  organizationId: string,
  invitationId: string,
): Promise<Invitation | null> => {
  const invitation = await db
    .updateTable("invitations")
    .set({ status: "REVOKED" })
    .where("id", "=", invitationId)
    .where("organization_id", "=", organizationId)
    .where("status", "=", "PENDING")
    .returning(INVITATION_COLUMNS)
    .executeTakeFirst();

  return invitation ?? null;
};

export const getInvitationByTokenHash = async (
  tokenHash: string,
): Promise<InvitationByToken | null> => {
  const invitation = await db
    .selectFrom("invitations")
    .innerJoin(
      "organizations",
      "organizations.id",
      "invitations.organization_id",
    )
    .innerJoin("roles", "roles.id", "invitations.role_id")
    .where("invitations.token_hash", "=", tokenHash)
    .where("organizations.deleted_at", "is", null)
    .select([
      "invitations.id",
      "invitations.organization_id",
      "organizations.name as organization_name",
      "invitations.email",
      "invitations.role_id",
      "roles.name as role_name",
      "invitations.status",
      "invitations.expires_at",
    ])
    .executeTakeFirst();

  return invitation ?? null;
};

export const markInvitationExpired = async (
  invitationId: string,
): Promise<void> => {
  await db
    .updateTable("invitations")
    .set({ status: "EXPIRED" })
    .where("id", "=", invitationId)
    .where("status", "=", "PENDING")
    .execute();
};

export const rejectInvitation = async (
  invitationId: string,
): Promise<boolean> => {
  const rejected = await db
    .updateTable("invitations")
    .set({ status: "REJECTED" })
    .where("id", "=", invitationId)
    .where("status", "=", "PENDING")
    .where("expires_at", ">", sql<Date>`now()`)
    .returning("id")
    .executeTakeFirst();

  return rejected !== undefined;
};

/**
 * Closes the invitation and creates the membership in one transaction. The
 * status guard on the UPDATE is what stops two concurrent accepts of the same
 * token from both succeeding. Returns null when the invitation was no longer
 * open by the time the row was claimed.
 */
export const acceptInvitation = async (
  invitationId: string,
  userId: string,
): Promise<{ membership_id: string; organization_id: string } | null> => {
  try {
    return await db.transaction().execute(async (trx) => {
      const invitation = await trx
        .updateTable("invitations")
        .set({ status: "ACCEPTED", accepted_at: sql<string>`now()` })
        .where("id", "=", invitationId)
        .where("status", "=", "PENDING")
        .where("expires_at", ">", sql<Date>`now()`)
        .returning(["organization_id", "role_id"])
        .executeTakeFirst();

      if (!invitation) {
        return null;
      }

      const membership = await trx
        .insertInto("memberships")
        .values({
          user_id: userId,
          organization_id: invitation.organization_id,
          role_id: invitation.role_id,
        })
        .returning(["id", "organization_id"])
        .executeTakeFirstOrThrow();

      return {
        membership_id: membership.id,
        organization_id: membership.organization_id,
      };
    });
  } catch (error) {
    if (error instanceof DatabaseError && error.code === PG_UNIQUE_VIOLATION) {
      throw new ConflictError("You are already a member of this organization");
    }

    throw error;
  }
};

/**
 * Whether the user owns `email` and has verified it. Returns null when the
 * address is not on the account at all.
 */
export const getUserEmailVerification = async (
  userId: string,
  email: string,
): Promise<{ is_verified: boolean } | null> => {
  const row = await db
    .selectFrom("user_emails")
    .where("user_id", "=", userId)
    .where(sql`lower(email)`, "=", email.toLowerCase())
    .select("is_verified")
    .executeTakeFirst();

  return row ?? null;
};
