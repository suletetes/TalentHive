import rateLimit from 'express-rate-limit';
import { logger } from '@/utils/logger';

// Check if rate limiting should be disabled for testing or development
const shouldBypassRateLimit = 
  process.env.DISABLE_RATE_LIMIT_FOR_TESTING === 'true' || 
  process.env.NODE_ENV === 'development';

if (shouldBypassRateLimit) {
  console.log('⚠️  Rate limiting is DISABLED for development/testing');
}

// Get environment-specific limits
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// General rate limiter with environment-specific limits
export const rateLimiter = shouldBypassRateLimit
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: isDevelopment ? 1000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = shouldBypassRateLimit
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : (process.env.NODE_ENV === 'test' ? 1000 : 5),
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many authentication attempts, please try again later.',
    });
  },
});

// Password reset rate limiter
export const passwordResetRateLimiter = shouldBypassRateLimit
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 100 : 3,
  message: {
    status: 'error',
    message: 'Too many password reset attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many password reset attempts, please try again later.',
    });
  },
});

// File upload rate limiter
export const uploadRateLimiter = shouldBypassRateLimit
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 200 : 20,
  message: {
    status: 'error',
    message: 'Too many file upload attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many file upload attempts, please try again later.',
    });
  },
});