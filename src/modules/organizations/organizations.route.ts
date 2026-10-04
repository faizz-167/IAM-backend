import { Router } from "express";
import { validateBody } from "../../lib/validateBody";
import { validateParams } from "../../lib/validateParams";
import { validateQuery } from "../../lib/validateQuery";
import {
  createOrganizationSchema,
  createRoleSchema,
  listOrganizationMembersQuerySchema,
  listOrganizationsQuerySchema,
  organizationIdParamSchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
  updateOrganizationSchema,
  updateOrganizationStatusSchema,
} from "./organizations.schema";
import * as organizationsController from "./organizations.controller";
import * as membersController from "../members/members.controller";
import * as invitationController from "../invitations/invitations.controller";
import * as auditController from "../audit/audit.controller";
import { listOrganizationAuditLogsQuerySchema } from "../audit/audit.schema";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireSuperAdmin } from "../../middlewares/requireSuperAdmin";
import { setOrgId } from "../../middlewares/organization.middleware";
import { getAuthContext } from "../../middlewares/getAuthContext";
import { requirePermission } from "../../middlewares/requirePermission";
import { PERMISSIONS } from "../permissions/permission.catalogue";
import {
  roleIdParamSchema,
  updateRolePermissionsSchema,
} from "../roles/roles.schema";
import { membershipIdParamSchema } from "../members/members.schema";
import {
  createInvitationSchema,
  invitationIdParamSchema,
  listInvitationsQuerySchema,
} from "../invitations/invitations.schema";

export const organizationsRouter = Router({ mergeParams: true });

organizationsRouter.use(authenticate);

organizationsRouter.post(
  "/",
  validateBody(createOrganizationSchema),
  organizationsController.createOrganizationController,
);

organizationsRouter.get(
  "/",
  organizationsController.getMyOrganizationsController,
);

organizationsRouter.get(
  "/admin",
  requireSuperAdmin,
  validateQuery(listOrganizationsQuerySchema),
  organizationsController.listOrganizationsController,
);

organizationsRouter.patch(
  "/:orgId/status",
  requireSuperAdmin,
  validateParams(organizationIdParamSchema),
  validateBody(updateOrganizationStatusSchema),
  organizationsController.updateOrganizationStatusController,
);

organizationsRouter.get(
  "/:orgId",
  validateParams(organizationIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ORGANIZATION_READ),
  organizationsController.getOrganizationController,
);

organizationsRouter.patch(
  "/:orgId",
  validateParams(organizationIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ORGANIZATION_UPDATE),
  validateBody(updateOrganizationSchema),
  organizationsController.updateOrganizationController,
);

organizationsRouter.delete(
  "/:orgId",
  validateParams(organizationIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ORGANIZATION_DELETE),
  organizationsController.deleteOrganizationController,
);

organizationsRouter.post(
  "/:orgId/roles",
  validateParams(organizationIdParamSchema),
  validateBody(createRoleSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ROLE_CREATE),
  organizationsController.createRoleController,
);

organizationsRouter.get(
  "/:orgId/roles",
  validateParams(organizationIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ROLE_READ),
  organizationsController.listRolesController,
);

organizationsRouter.get(
  "/:orgId/roles/:roleId",
  validateParams(organizationIdParamSchema),
  validateParams(roleIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ROLE_READ),
  organizationsController.listRoleByIdController,
);

organizationsRouter.patch(
  "/:orgId/roles/:roleId",
  validateParams(organizationIdParamSchema),
  validateParams(roleIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ROLE_UPDATE),
  validateBody(createRoleSchema),
  organizationsController.updateRoleController,
);

organizationsRouter.delete(
  "/:orgId/roles/:roleId",
  validateParams(organizationIdParamSchema),
  validateParams(roleIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ROLE_DELETE),
  organizationsController.deleteRoleController,
);

organizationsRouter.put(
  "/:orgId/roles/:roleId/permissions",
  validateParams(organizationIdParamSchema),
  validateParams(roleIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.ROLE_UPDATE),
  validateBody(updateRolePermissionsSchema),
  organizationsController.updateRolePermissionsController,
);

organizationsRouter.get(
  "/:orgId/members",
  validateParams(organizationIdParamSchema),
  validateQuery(listOrganizationMembersQuerySchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.MEMBERSHIP_READ),
  organizationsController.listOrganizationMembersController,
);

organizationsRouter.delete(
  "/:orgId/members/me",
  validateParams(organizationIdParamSchema),
  setOrgId,
  getAuthContext,
  membersController.deleteMyMembershipController,
);

organizationsRouter.patch(
  "/:orgId/members/:membershipId/role",
  validateParams(organizationIdParamSchema),
  validateParams(membershipIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.MEMBERSHIP_UPDATE),
  validateBody(updateMemberRoleSchema),
  membersController.updateMemberRoleController,
);

organizationsRouter.patch(
  "/:orgId/members/:membershipId/status",
  validateParams(organizationIdParamSchema),
  validateParams(membershipIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.MEMBERSHIP_UPDATE),
  validateBody(updateMemberStatusSchema),
  membersController.updateMemberStatusController,
);

organizationsRouter.delete(
  "/:orgId/members/:membershipId",
  validateParams(organizationIdParamSchema),
  validateParams(membershipIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.MEMBERSHIP_DELETE),
  membersController.deleteMembershipController,
);

organizationsRouter.post(
  "/:orgId/invitations",
  validateParams(organizationIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.MEMBERSHIP_CREATE),
  validateBody(createInvitationSchema),
  invitationController.createInvitationController,
);

organizationsRouter.get(
  "/:orgId/invitations",
  validateParams(organizationIdParamSchema),
  validateQuery(listInvitationsQuerySchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.MEMBERSHIP_READ),
  invitationController.listInvitationsController,
);

organizationsRouter.post(
  "/:orgId/invitations/:invitationId/resend",
  validateParams(organizationIdParamSchema),
  validateParams(invitationIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.MEMBERSHIP_CREATE),
  invitationController.resendInvitationController,
);

organizationsRouter.delete(
  "/:orgId/invitations/:invitationId",
  validateParams(organizationIdParamSchema),
  validateParams(invitationIdParamSchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.MEMBERSHIP_CREATE),
  invitationController.revokeInvitationController,
);

organizationsRouter.get(
  "/:orgId/audit-logs",
  validateParams(organizationIdParamSchema),
  validateQuery(listOrganizationAuditLogsQuerySchema),
  setOrgId,
  getAuthContext,
  requirePermission(PERMISSIONS.AUDIT_READ),
  auditController.listOrganizationAuditLogsController,
);
