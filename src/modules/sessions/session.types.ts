export type Session = {
  user_id: string;
  refresh_token_hash: string;
  expires_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
};
