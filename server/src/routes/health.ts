import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedisClient, isRedisEnabled } from '@/config/redis';
import { ResponseFormatter } from '@/utils/standardResponse';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
      details?: string;
    };
    redis: {
      status: 'connected' | 'disconnected' | 'disabled';
      responseTime?: number;
      details?: string;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

// Basic health check endpoint
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: await checkDatabaseHealth(),
        redis: await checkRedisHealth(),
        memory: getMemoryUsage(),
        cpu: getCpuUsage(),
      },
    };

    // Determine overall health status
    const dbHealthy = healthStatus.services.database.status === 'connected';
    const redisHealthy = healthStatus.services.redis.status === 'connected' || 
                        healthStatus.services.redis.status === 'disabled';
    const memoryHealthy = healthStatus.services.memory.percentage < 90;

    if (!dbHealthy) {
      healthStatus.status = 'unhealthy';
    } else if (!redisHealthy || !memoryHealthy) {
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return ResponseFormatter.success(res, 'Health check completed', healthStatus, statusCode);
  } catch (error: any) {
    return ResponseFormatter.serverError(res, 'Health check failed', error.message);
  }
});

// Detailed health check endpoint
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const healthStatus = await getDetailedHealthStatus();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return ResponseFormatter.success(res, 'Detailed health check completed', healthStatus, statusCode);
  } catch (error: any) {
    return ResponseFormatter.serverError(res, 'Detailed health check failed', error.message);
  }
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbStatus = await checkDatabaseHealth();
    
    if (dbStatus.status !== 'connected') {
      return ResponseFormatter.serverError(res, 'Service not ready - database unavailable');
    }

    return ResponseFormatter.success(res, 'Service is ready');
  } catch (error: any) {
    return ResponseFormatter.serverError(res, 'Service not ready', error.message);
  }
});

// Liveness probe (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  // Simple liveness check - if we can respond, we're alive
  return ResponseFormatter.success(res, 'Service is alive', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Database health check
async function checkDatabaseHealth() {
  const startTime = Date.now();
  
  try {
    const state = mongoose.connection.readyState;
    
    if (state === 1) {
      // Test database with a simple query
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'connected' as const,
        responseTime: Date.now() - startTime,
        details: `Connected to ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`,
      };
    } else {
      return {
        status: 'disconnected' as const,
        details: `Connection state: ${getConnectionStateName(state)}`,
      };
    }
  } catch (error: any) {
    return {
      status: 'error' as const,
      responseTime: Date.now() - startTime,
      details: error.message,
    };
  }
}

// Redis health check
async function checkRedisHealth() {
  const startTime = Date.now();
  
  if (!isRedisEnabled()) {
    return {
      status: 'disabled' as const,
      details: 'Redis is not configured or disabled',
    };
  }

  try {
    const client = getRedisClient();
    if (!client) {
      return {
        status: 'disconnected' as const,
        details: 'Redis client not available',
      };
    }

    // Test Redis with a ping
    await client.ping();
    
    return {
      status: 'connected' as const,
      responseTime: Date.now() - startTime,
      details: 'Redis connection healthy',
    };
  } catch (error: any) {
    return {
      status: 'disconnected' as const,
      responseTime: Date.now() - startTime,
      details: error.message,
    };
  }
}

// Memory usage
function getMemoryUsage() {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal + memUsage.external;
  const usedMemory = memUsage.heapUsed;
  
  return {
    used: Math.round(usedMemory / 1024 / 1024), // MB
    total: Math.round(totalMemory / 1024 / 1024), // MB
    percentage: Math.round((usedMemory / totalMemory) * 100),
  };
}

// CPU usage (simplified)
function getCpuUsage() {
  const cpuUsage = process.cpuUsage();
  const totalUsage = cpuUsage.user + cpuUsage.system;
  
  return {
    usage: Math.round(totalUsage / 1000000), // Convert to milliseconds
  };
}

// Get detailed health status
async function getDetailedHealthStatus() {
  const healthStatus: HealthStatus & { 
    dependencies: any;
    environmentDetails: any;
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      memory: getMemoryUsage(),
      cpu: getCpuUsage(),
    },
    dependencies: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    environmentDetails: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      timezone: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  // Determine overall health status
  const dbHealthy = healthStatus.services.database.status === 'connected';
  const redisHealthy = healthStatus.services.redis.status === 'connected' || 
                      healthStatus.services.redis.status === 'disabled';
  const memoryHealthy = healthStatus.services.memory.percentage < 90;

  if (!dbHealthy) {
    healthStatus.status = 'unhealthy';
  } else if (!redisHealthy || !memoryHealthy) {
    healthStatus.status = 'degraded';
  }

  return healthStatus;
}

// Helper function to get connection state name
function getConnectionStateName(state: number): string {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[state as keyof typeof states] || 'unknown';
}

export default router;