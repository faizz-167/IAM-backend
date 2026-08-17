type UserStatus = "ACTIVE" | "SUSPENDED" | "LOCKED" | "PENDING";

export type UserWithCredentials = {
  id: string;
  display_name: string;
  email: string;
  status: UserStatus;
  password_hash: string;
  failed_login_attempts: number;
  locked_until: Date | null;
  is_super_admin: boolean;
  created_at: Date;
  updated_at: Date;
};
