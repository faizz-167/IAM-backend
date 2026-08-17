import { randomInt } from "node:crypto";
import { PublicUser } from "./auth.types";
import { UserWithCredentials } from "../users/user.types";

export function convertToPublicUser(user: UserWithCredentials): PublicUser {
  return {
    id: user.id,
    display_name: user.display_name,
    email: user.email,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}
