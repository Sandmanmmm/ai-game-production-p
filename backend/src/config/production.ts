import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenvConfig({ path: path.resolve(__dirname, '..', envFile) });

export const config = {
  // Server Configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  
  // Database
  databaseUrl: process.env.DATABASE_URL!,
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
  
  // Authentication
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // OAuth
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  
  // AI Services
  vastGpuEndpoint: process.env.VAST_GPU_ENDPOINT,
  huggingfaceToken: process.env.HUGGINGFACE_API_TOKEN,
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Rate Limiting
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // File Upload
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50MB',
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  
  // Email (SMTP)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
  },
  
  // Monitoring
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
  prometheus: {
    port: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
  },
  
  // Security
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [process.env.FRONTEND_URL || 'http://localhost:5000'],
    trustProxy: process.env.TRUST_PROXY === 'true',
    sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  },
  
  // Asset Generation
  assetGeneration: {
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '5', 10),
    jobTimeout: parseInt(process.env.JOB_TIMEOUT_MS || '300000', 10), // 5 minutes
    retryAttempts: parseInt(process.env.JOB_RETRY_ATTEMPTS || '3', 10),
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

if (config.nodeEnv === 'production') {
  requiredEnvVars.push(
    'FRONTEND_URL',
    'VAST_GPU_ENDPOINT'
  );
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export default config;
