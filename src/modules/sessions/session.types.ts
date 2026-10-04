export type Session = {
  user_id: string;
  refresh_token_hash: string;
  expires_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  device_name?: string | null;
  family_id?: string;
};

export type ActiveSession = {
  id: string;
  device_name: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: Date;
  expires_at: Date;
  current: boolean;
};
