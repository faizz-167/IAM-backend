import { PublicUser, UserWithCredentials } from "./auth.types";

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
