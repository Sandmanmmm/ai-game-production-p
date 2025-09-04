declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string; // Keep for backward compatibility
        email: string;
      };
    }
  }
}

export {};
