type UserStatus = "ACTIVE" | "SUSPENDED" | "LOCKED" | "PENDING";

export type UserWithCredentials = {
  id: string;
  display_name: string;
  email: string;
  status: UserStatus;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
};

export type PublicUser = Omit<UserWithCredentials, "password_hash">;

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
