import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';

let redisClient: RedisClientType | null = null;
let redisEnabled = false;

export const connectRedis = async (): Promise<void> => {
  // Check if Redis is configured
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  
  if (!redisUrl && !redisHost) {
    logger.warn('⚠️  Redis not configured - running without cache');
    redisEnabled = false;
    return;
  }

  try {
    if (redisUrl) {
      // Use URL format (e.g., redis://username:password@host:port)
      redisClient = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: false as false, // Disable auto-reconnect
        },
      });
    } else {
      // Use traditional format
      redisClient = createClient({
        socket: {
          host: redisHost || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          reconnectStrategy: false as false, // Disable auto-reconnect
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '0'),
      });
    }

    redisClient.on('error', (error) => {
      logger.error('Redis connection error - disabling cache:', error);
      redisEnabled = false;
    });

    redisClient.on('connect', () => {
      logger.info('🔴 Redis connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('🔴 Redis connected and ready');
      redisEnabled = true;
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection ended');
      redisEnabled = false;
    });

    await redisClient.connect();
    redisEnabled = true;
  } catch (error) {
    logger.warn('⚠️  Redis connection failed - continuing without cache');
    redisEnabled = false;
    if (redisClient) {
      try {
        await redisClient.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
    redisClient = null;
  }
};

export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

export const isRedisEnabled = (): boolean => {
  return redisEnabled && redisClient !== null;
};

// Export redisClient directly for compatibility
export { redisClient };

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient && redisEnabled) {
      await redisClient.quit();
      logger.info('Redis connection closed');
      redisEnabled = false;
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
};

// Cache utility functions
export const setCache = async (key: string, value: any, expireInSeconds?: number): Promise<void> => {
  if (!isRedisEnabled()) {
    return; // Silently skip if Redis is not available
  }
  
  try {
    const client = getRedisClient();
    if (!client) return;
    
    const serializedValue = JSON.stringify(value);
    
    if (expireInSeconds) {
      await client.setEx(key, expireInSeconds, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
  } catch (error) {
    logger.error('Error setting cache:', error);
    // Don't throw - allow app to continue without cache
  }
};

export const getCache = async (key: string): Promise<any> => {
  if (!isRedisEnabled()) {
    return null; // Return null if Redis is not available
  }
  
  try {
    const client = getRedisClient();
    if (!client) return null;
    
    const value = await client.get(key);
    
    if (value) {
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    logger.error('Error getting cache:', error);
    return null; // Return null on error
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  if (!isRedisEnabled()) {
    return; // Silently skip if Redis is not available
  }
  
  try {
    const client = getRedisClient();
    if (!client) return;
    
    await client.del(key);
  } catch (error) {
    logger.error('Error deleting cache:', error);
    // Don't throw - allow app to continue
  }
};

export const clearCache = async (pattern?: string): Promise<void> => {
  if (!isRedisEnabled()) {
    return; // Silently skip if Redis is not available
  }
  
  try {
    const client = getRedisClient();
    if (!client) return;
    
    if (pattern) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } else {
      await client.flushDb();
    }
  } catch (error) {
    logger.error('Error clearing cache:', error);
    // Don't throw - allow app to continue
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectRedis();
});

process.on('SIGTERM', async () => {
  await disconnectRedis();
});