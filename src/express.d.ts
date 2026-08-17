declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
      isSuperAdmin?: boolean;
    }
  }
}

export {};
