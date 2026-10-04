import { Insertable, Kysely } from "kysely";
import { db } from "../../database";
import { Database } from "../../database/types";
import { paginate, Paginated, PaginationQuery } from "../../lib/pagination";
import { AuditLog, AuditLogFilters } from "./audit.types";

export const insertAuditLog = async (
  executor: Kysely<Database>,
  row: Insertable<Database["audit_logs"]>,
): Promise<void> => {
  await executor.insertInto("audit_logs").values(row).execute();
};

export const listAuditLogs = async (
  filters: AuditLogFilters,
  pagination: PaginationQuery,
): Promise<Paginated<AuditLog>> => {
  let query = db
    .selectFrom("audit_logs")
    .leftJoin("users", "users.id", "audit_logs.actor_user_id")
    .select([
      "audit_logs.id",
      "audit_logs.organization_id",
      "audit_logs.actor_user_id",
      "users.display_name as actor_display_name",
      "audit_logs.action",
      "audit_logs.resource",
      "audit_logs.target_id",
      "audit_logs.metadata",
      "audit_logs.ip_address",
      "audit_logs.user_agent",
      "audit_logs.created_at",
    ])
    .orderBy("audit_logs.created_at", "desc")
    .orderBy("audit_logs.id", "desc");

  if (filters.organization_id) {
    query = query.where(
      "audit_logs.organization_id",
      "=",
      filters.organization_id,
    );
  }

  if (filters.actor_user_id) {
    query = query.where("audit_logs.actor_user_id", "=", filters.actor_user_id);
  }

  if (filters.resource) {
    query = query.where("audit_logs.resource", "=", filters.resource);
  }

  if (filters.action) {
    query = query.where("audit_logs.action", "=", filters.action);
  }

  if (filters.from) {
    query = query.where("audit_logs.created_at", ">=", filters.from);
  }

  if (filters.to) {
    query = query.where("audit_logs.created_at", "<=", filters.to);
  }

  return await paginate(query, pagination);
};
