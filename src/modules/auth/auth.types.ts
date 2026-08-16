import { UserWithCredentials } from "../users/user.types";

export type PublicUser = Omit<
  UserWithCredentials,
  "password_hash" | "failed_login_attempts" | "locked_until"
>;

export type PublicUserWithToken = {
  user: PublicUser;
  token: string;
};

export type LoginResult = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
};
