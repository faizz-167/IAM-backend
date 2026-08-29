import { ForbiddenError, InternalServerError } from "../../errors/RequestError";
import { PermissionName } from "../permissions/permission.catalogue";
import { AuthContext } from "./auth.types";

/**
 * Non-throwing check. Use when the caller wants to branch on access, for
 * example to hide a field rather than reject the whole request.
 */
export const can = (
  authContext: AuthContext,
  permission: PermissionName,
): boolean => authContext.permissions.has(permission);

/**
 * Asserts the caller holds `permission` in the organization the context was
 * loaded for. Throws rather than returning a boolean so a forgotten check reads
 * as a bug at the call site instead of silently allowing the action.
 *
 * A missing context is a 500, not a 403: it means the route was wired without
 * `getAuthContext`, which is a server mistake and not the caller's fault.
 */
export const authorize = (
  authContext: AuthContext | undefined,
  permission: PermissionName,
): AuthContext => {
  if (!authContext) {
    throw new InternalServerError(
      "Auth context is missing in the request context",
    );
  }

  if (!can(authContext, permission)) {
    throw new ForbiddenError("Insufficient permissions");
  }

  return authContext;
};
