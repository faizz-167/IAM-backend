import { Kysely } from "kysely";
import { db } from "../../database";
import { Database } from "../../database/types";
import { getRequestContext } from "../../lib/requestContext";
import { PaginationQuery, Paginated } from "../../lib/pagination";
import * as auditRepo from "./audit.repo";
import { AuditEntry, AuditLog, AuditLogFilters } from "./audit.types";

/**
 * Writes one audit row. Pass the caller's transaction when there is one, so a
 * rolled-back change cannot leave an audit row behind. A failure here is not
 * swallowed: inside a transaction it rolls the change back with it.
 */
export const recordAudit = async (
  entry: AuditEntry,
  executor: Kysely<Database> = db,
): Promise<void> => {
  const { ipAddress, userAgent } = getRequestContext();

  await auditRepo.insertAuditLog(executor, {
    action: entry.action,
    resource: entry.resource,
    actor_user_id: entry.actorUserId,
    organization_id: entry.organizationId ?? null,
    target_id: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
    ip_address: ipAddress,
    user_agent: userAgent,
  });
};

export const listAuditLogs = async (
  filters: AuditLogFilters,
  pagination: PaginationQuery,
): Promise<Paginated<AuditLog>> => {
  return await auditRepo.listAuditLogs(filters, pagination);
};
