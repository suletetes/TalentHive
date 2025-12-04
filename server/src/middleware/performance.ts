import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request timing middleware
 */
export const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Skip logging for polling endpoints with 401 errors (expired tokens are normal)
    const isPollingEndpoint = req.originalUrl.includes('/unread-count') || 
                              req.originalUrl.includes('/conversations');
    const is401 = res.statusCode === 401;
    
    if (isPollingEndpoint && is401) {
      return; // Skip logging
    }
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.clientIP || req.ip,
    };

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', logData);
    } else if (process.env.NODE_ENV === 'development') {
      logger.info('Request completed', logData);
    }
  });

  next();
};

/**
 * Memory monitoring
 */
export const monitorMemory = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memoryData = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    };

    // Warn if memory usage is high
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      logger.warn('High memory usage detected', memoryData);
    } else if (process.env.NODE_ENV === 'development') {
      logger.debug('Memory usage', memoryData);
    }
  }, 60000); // Check every minute
};

/**
 * Response compression check
 */
export const compressionCheck = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  res.send = function (data: any) {
    const size = Buffer.byteLength(JSON.stringify(data));
    
    if (size > 100 * 1024 && process.env.NODE_ENV === 'development') { // 100KB
      logger.warn('Large response detected', {
        url: req.originalUrl,
        size: `${Math.round(size / 1024)}KB`,
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Cache control headers
 */
export const cacheControl = (maxAge: number = 3600) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
};

/**
 * No cache headers for sensitive routes
 */
export const noCache = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};
