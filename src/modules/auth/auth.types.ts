type UserStatus = "ACTIVE" | "SUSPENDED" | "LOCKED" | "PENDING";

export type UserWithCredentials = {
  id: string;
  display_name: string;
  email: string;
  status: UserStatus;
  password_hash: string;
  failed_login_attempts: number;
  locked_until: Date | null;
  created_at: Date;
  updated_at: Date;
};

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
