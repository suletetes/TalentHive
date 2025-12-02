import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';

/**
 * Rate limiting configuration
 */
export const createRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes

/**
 * Auth rate limiter
 */
export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes

/**
 * API rate limiter
 */
export const apiRateLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes

/**
 * Input sanitization middleware
 */
export const sanitizeInput = () => {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized input detected: ${key} in ${req.method} ${req.path}`);
    },
  });
};

/**
 * Security headers middleware
 */
export const securityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });
};

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

/**
 * Request validation middleware
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check for required headers only if there's actual body content
  const hasBody = req.body && Object.keys(req.body).length > 0;
  
  if (!req.headers['content-type'] && ['POST', 'PUT', 'PATCH'].includes(req.method) && hasBody) {
    console.warn(`[SECURITY] Missing Content-Type header for ${req.method} ${req.path} with body`);
    return res.status(400).json({
      status: 'error',
      message: 'Content-Type header is required for requests with body',
    });
  }

  // Validate JSON body
  if (req.headers['content-type']?.includes('application/json') && req.body) {
    try {
      JSON.stringify(req.body);
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid JSON in request body',
      });
    }
  }

  next();
};

/**
 * IP tracking middleware
 */
export const trackIP = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  req.clientIP = ip as string;
  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      clientIP?: string;
    }
  }
}
