// Security configuration and utilities
import { SecurityUtils } from '@/utils/envValidation';

// Content Security Policy configuration
export const CSP_CONFIG = {
  directives: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite in development
      "'unsafe-eval'", // Required for Vite in development
      'https://js.stripe.com',
      SecurityUtils.isDevelopment() ? "'unsafe-eval'" : null,
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Material-UI
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:',
    ],
    'media-src': [
      "'self'",
      'https:',
    ],
    'connect-src': [
      "'self'",
      'https://api.stripe.com',
      'https://res.cloudinary.com',
      'https://api.cloudinary.com',
      'wss:',
      'ws:',
      SecurityUtils.isDevelopment() ? 'http://localhost:*' : null,
    ].filter(Boolean),
    'frame-src': [
      'https://js.stripe.com',
      'https://hooks.stripe.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': SecurityUtils.isProduction() ? [] : null,
  },
};

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
  ].join(', '),
};

// Rate limiting configuration
export const RATE_LIMITS = {
  // API requests per minute
  API_REQUESTS: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  // Login attempts per 15 minutes
  LOGIN_ATTEMPTS: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  // Password reset requests per hour
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  },
  // File uploads per 10 minutes
  FILE_UPLOADS: {
    maxRequests: 10,
    windowMs: 10 * 60 * 1000,
  },
  // Search requests per minute
  SEARCH_REQUESTS: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
};

// Input validation rules
export const VALIDATION_RULES = {
  // Text input limits
  TEXT_LIMITS: {
    firstName: { min: 1, max: 50 },
    lastName: { min: 1, max: 50 },
    title: { min: 1, max: 100 },
    bio: { min: 0, max: 1000 },
    projectTitle: { min: 5, max: 100 },
    projectDescription: { min: 50, max: 5000 },
    messageContent: { min: 1, max: 2000 },
    proposalCoverLetter: { min: 100, max: 3000 },
  },
  
  // File upload limits
  FILE_LIMITS: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxFiles: 5,
  },
  
  // URL validation
  URL_PATTERNS: {
    website: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    linkedin: /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,
    github: /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/,
  },
};

// Security event types for logging
export enum SecurityEventType {
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  INVALID_TOKEN = 'invalid_token',
  SUSPICIOUS_CONTENT = 'suspicious_content',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  FILE_UPLOAD_REJECTED = 'file_upload_rejected',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_TOKEN_MISMATCH = 'csrf_token_mismatch',
  PERMISSION_DENIED = 'permission_denied',
}

// Security event logger
export class SecurityLogger {
  private static events: Array<{
    type: SecurityEventType;
    details: any;
    timestamp: string;
    userAgent: string;
    url: string;
  }> = [];

  static logEvent(type: SecurityEventType, details: any = {}) {
    const event = {
      type,
      details: SecurityUtils.sanitizeForLogging(details),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.events.push(event);

    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events.shift();
    }

    // Log to console in development
    if (SecurityUtils.isDevelopment()) {
      console.warn(`Security Event [${type}]:`, event);
    }

    // In production, you would send this to your security monitoring service
    if (SecurityUtils.isProduction()) {
      // Example: Send to monitoring service
      // this.sendToMonitoringService(event);
    }
  }

  static getEvents(): typeof SecurityLogger.events {
    return [...this.events];
  }

  static clearEvents() {
    this.events = [];
  }

  private static sendToMonitoringService(event: any) {
    // Implementation would depend on your monitoring service
    // Example: Sentry, LogRocket, custom endpoint, etc.
    console.log('Would send to monitoring service:', event);
  }
}

// Security middleware for API requests
export const createSecurityMiddleware = () => {
  const rateLimiters = new Map<string, () => boolean>();

  return {
    // Check rate limits
    checkRateLimit: (key: string, config: { maxRequests: number; windowMs: number }) => {
      if (!rateLimiters.has(key)) {
        rateLimiters.set(key, SecurityUtils.createRateLimiter(config.maxRequests, config.windowMs));
      }
      
      const rateLimiter = rateLimiters.get(key)!;
      const allowed = rateLimiter();
      
      if (!allowed) {
        SecurityLogger.logEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, { key, config });
      }
      
      return allowed;
    },

    // Validate request data
    validateRequest: (data: any, rules: any) => {
      const errors: string[] = [];
      
      Object.entries(rules).forEach(([field, rule]: [string, any]) => {
        const value = data[field];
        
        if (rule.required && (!value || value.toString().trim() === '')) {
          errors.push(`${field} is required`);
        }
        
        if (value && rule.min && value.toString().length < rule.min) {
          errors.push(`${field} must be at least ${rule.min} characters`);
        }
        
        if (value && rule.max && value.toString().length > rule.max) {
          errors.push(`${field} must not exceed ${rule.max} characters`);
        }
        
        if (value && rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      });
      
      return {
        isValid: errors.length === 0,
        errors,
      };
    },

    // Sanitize request data
    sanitizeRequest: (data: any) => {
      return SecurityUtils.sanitizeForLogging(data);
    },
  };
};

// Initialize security configuration
export const initializeSecurity = () => {
  // Set up CSP if supported
  if (typeof document !== 'undefined' && document.head) {
    const cspContent = Object.entries(CSP_CONFIG.directives)
      .map(([directive, sources]) => {
        if (!sources || sources.length === 0) return null;
        return `${directive} ${sources.join(' ')}`;
      })
      .filter(Boolean)
      .join('; ');

    const metaTag = document.createElement('meta');
    metaTag.httpEquiv = 'Content-Security-Policy';
    metaTag.content = cspContent;
    document.head.appendChild(metaTag);
  }

  // Log security initialization
  console.log('Security configuration initialized successfully');
};

// Export security utilities
export { SecurityUtils } from '@/utils/envValidation';