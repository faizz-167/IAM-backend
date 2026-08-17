import { NotFoundError } from "../../errors/RequestError";
import { getUserById } from "../users/user.repo";
import { SystemRoleInput } from "./roles.schema";
import * as roleRepo from "./roles.repo";
import { Role } from "./roles.types";

export const createSystemRoles = async (
  input: SystemRoleInput,
  userId: string,
): Promise<Role> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new NotFoundError("User");
  }

  const role = await roleRepo.createSystemRole(input);
  return role;
};
