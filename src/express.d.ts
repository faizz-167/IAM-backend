import { AuthContext } from "./modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
      isSuperAdmin?: boolean;
      orgId?: string;
      authContext?: AuthContext;
    }
  }
}

export {};
