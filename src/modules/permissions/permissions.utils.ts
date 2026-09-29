import { ALL_PERMISSION_NAMES, PermissionName } from "./permission.catalogue";
import { ForbiddenError } from "../../errors/RequestError";
import { PermissionAction, PermissionResource } from "./permissions.types";

const PERMISSION_NAME_SET = new Set<string>(ALL_PERMISSION_NAMES);

/**
 * Builds the canonical `RESOURCE:ACTION` name for a permission. Every write to
 * `permissions.name` goes through here so stored names cannot drift from the
 * catalogue the route guards check against.
 *
 * Not every pair it can build is a real permission - the catalogue is a subset
 * of `resource x action` - so pair this with `isPermissionName`.
 */
export const permissionName = (
  resource: PermissionResource,
  action: PermissionAction,
): `${PermissionResource}:${PermissionAction}` => `${resource}:${action}`;

export const isPermissionName = (value: string): value is PermissionName =>
  PERMISSION_NAME_SET.has(value);

export const assertNoEscalation = (
  requestedPermissions: string[],
  callerPermissions: Set<PermissionName>,
): void => {
  const notHeld = requestedPermissions.filter(
    (name) => !callerPermissions.has(name as PermissionName),
  );

  if (notHeld.length > 0) {
    throw new ForbiddenError(
      `Cannot grant permissions you do not hold: ${notHeld.join(", ")}`,
    );
  }
};
