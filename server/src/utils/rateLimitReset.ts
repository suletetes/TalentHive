import { Request, Response } from 'express';

/**
 * Utility to reset rate limits for development
 * This should only be used in development environment
 */
export const resetRateLimits = (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      status: 'error',
      message: 'Rate limit reset is only available in development mode'
    });
  }

  // Clear rate limit store (this depends on your rate limiter implementation)
  // For memory store, this would clear the in-memory cache
  // For Redis store, you'd need to clear Redis keys
  
  res.json({
    status: 'success',
    message: 'Rate limits have been reset for development'
  });
};

/**
 * Middleware to bypass rate limiting for specific IPs in development
 */
export const developmentRateLimitBypass = (req: Request, res: Response, next: Function) => {
  if (process.env.NODE_ENV === 'development') {
    // Skip rate limiting for localhost and development IPs
    const developmentIPs = ['127.0.0.1', '::1', 'localhost'];
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (developmentIPs.some(ip => clientIP?.includes(ip))) {
      return next();
    }
  }
  
  next();
};