type UserStatus = "ACTIVE" | "SUSPENDED" | "LOCKED";

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
