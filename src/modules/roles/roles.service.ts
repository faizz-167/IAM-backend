import { SystemRoleInput } from "./roles.schema";
import * as roleRepo from "./roles.repo";
import { Role } from "./roles.types";

export const createSystemRoles = async (
  input: SystemRoleInput,
): Promise<Role> => {
  const role = await roleRepo.createSystemRole(input);
  return role;
};
