import Redis from 'ioredis';
import { ConnectionOptions } from 'bullmq';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 0,
  lazyConnect: true,
};

// Create Redis client instance
export const redis = new Redis(redisConfig);

// BullMQ connection options
export const bullMQConnection: ConnectionOptions = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  db: redisConfig.db,
};

// Handle Redis connection events
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redis.on('ready', () => {
  console.log('🚀 Redis is ready to accept commands');
});

redis.on('close', () => {
  console.log('⚠️  Redis connection closed');
});

// Graceful shutdown - disable in development for PowerShell compatibility
if (process.env.NODE_ENV !== 'development') {
  process.on('SIGINT', async () => {
    console.log('Closing Redis connection...');
    await redis.quit();
    process.exit(0);
  });
} else {
  console.log('🔄 Redis signal handler disabled in development mode (PowerShell compatibility)');
}

export default redis;
