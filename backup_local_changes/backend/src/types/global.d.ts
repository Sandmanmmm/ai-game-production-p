// Global type declarations for Express Request extension
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        email: string;
        [key: string]: any;
      };
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DATABASE_URL: string;

      // Server
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      FRONTEND_URL: string;

      // JWT & Auth
      JWT_SECRET: string;
      SESSION_SECRET: string;
      GITHUB_CLIENT_ID: string;
      GITHUB_CLIENT_SECRET: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;

      // AI Services
      HUGGINGFACE_API_KEY: string;
      REPLICATE_API_TOKEN: string;
      USE_LOCAL_AI: string;
      LOCAL_AI_BASE_URL: string;

      // Redis & Job Queue
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD: string;
      REDIS_DB: string;
      REDIS_MAX_RETRIES: string;

      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;
    }
  }
}

export {};
