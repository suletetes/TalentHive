// Environment variable validation and security utilities
import { toast } from 'react-hot-toast';

interface EnvConfig {
  // API Configuration
  VITE_API_BASE_URL: string;
  VITE_SOCKET_URL: string;
  
  // App Configuration
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  
  // External Services
  VITE_STRIPE_PUBLISHABLE_KEY: string;
  VITE_CLOUDINARY_CLOUD_NAME: string;
  VITE_CLOUDINARY_UPLOAD_PRESET: string;
  
  // Feature Flags
  VITE_ENABLE_ANALYTICS: string;
  VITE_ENABLE_SENTRY: string;
  VITE_ENABLE_DEVTOOLS: string;
  
  // Environment
  VITE_NODE_ENV: string;
  
  // Build Configuration (optional)
  GENERATE_SOURCEMAP?: string;
  USE_CDN?: string;
  ANALYZE?: string;
  VITE_ENABLE_CSP?: string;
  VITE_ENABLE_SECURITY_HEADERS?: string;
}

// Required environment variables
const REQUIRED_ENV_VARS: (keyof EnvConfig)[] = [
  'VITE_API_BASE_URL',
  'VITE_SOCKET_URL',
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
  'VITE_NODE_ENV',
];

// Environment variables required in production
const PRODUCTION_REQUIRED_VARS: (keyof EnvConfig)[] = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_CLOUDINARY_CLOUD_NAME',
  'VITE_CLOUDINARY_UPLOAD_PRESET',
];

// Environment variables that should not contain placeholder values
const PLACEHOLDER_PATTERNS = [
  'your_',
  'replace_with_',
  'add_your_',
  'enter_your_',
  'put_your_',
  'insert_your_',
  '_here',
  'example_',
  'test_key_here',
  'your_actual_',
  'localhost', // Should not be in production
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

// Validate environment variables
export const validateEnvironment = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];
  
  const isProduction = import.meta.env.VITE_NODE_ENV === 'production';
  const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development';
  
  // Check required variables
  REQUIRED_ENV_VARS.forEach((varName) => {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });
  
  // Check production-specific requirements
  if (isProduction) {
    PRODUCTION_REQUIRED_VARS.forEach((varName) => {
      const value = import.meta.env[varName];
      if (!value || value.trim() === '') {
        errors.push(`Missing required production environment variable: ${varName}`);
      }
    });
  }
  
  // Check for placeholder values in sensitive variables
  const sensitiveVars: (keyof EnvConfig)[] = [
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_CLOUDINARY_CLOUD_NAME',
    'VITE_CLOUDINARY_UPLOAD_PRESET',
  ];
  
  sensitiveVars.forEach((varName) => {
    const value = import.meta.env[varName];
    if (value) {
      const hasPlaceholder = PLACEHOLDER_PATTERNS.some(pattern => 
        value.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (hasPlaceholder) {
        if (isProduction) {
          errors.push(`Environment variable ${varName} contains placeholder value. Please set actual value.`);
        } else {
          warnings.push(`Environment variable ${varName} contains placeholder value.`);
        }
      }
    }
  });
  
  // Validate API URLs
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiUrl) {
    if (!isValidUrl(apiUrl)) {
      errors.push('VITE_API_BASE_URL must be a valid URL');
    } else {
      // Check for localhost in production
      if (isProduction && apiUrl.includes('localhost')) {
        errors.push('VITE_API_BASE_URL should not use localhost in production');
      }
      
      // Check for HTTPS in production
      if (isProduction && !apiUrl.startsWith('https://')) {
        warnings.push('VITE_API_BASE_URL should use HTTPS in production');
      }
    }
  }
  
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  if (socketUrl) {
    if (!isValidUrl(socketUrl)) {
      errors.push('VITE_SOCKET_URL must be a valid URL');
    } else {
      // Check for localhost in production
      if (isProduction && socketUrl.includes('localhost')) {
        errors.push('VITE_SOCKET_URL should not use localhost in production');
      }
    }
  }
  
  // Validate Stripe key format
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (stripeKey && !stripeKey.startsWith('pk_')) {
    errors.push('VITE_STRIPE_PUBLISHABLE_KEY must start with "pk_"');
  }
  
  // Check for development-specific settings in production
  if (isProduction) {
    const devtools = import.meta.env.VITE_ENABLE_DEVTOOLS;
    if (devtools === 'true') {
      warnings.push('VITE_ENABLE_DEVTOOLS should be false in production');
    }
    
    const sourcemap = import.meta.env.GENERATE_SOURCEMAP;
    if (sourcemap === 'true') {
      warnings.push('GENERATE_SOURCEMAP should be false in production for security');
    }
  }
  
  // Validate boolean environment variables
  const booleanVars = [
    'VITE_ENABLE_ANALYTICS',
    'VITE_ENABLE_SENTRY',
    'VITE_ENABLE_DEVTOOLS',
    'GENERATE_SOURCEMAP',
    'USE_CDN',
    'ANALYZE',
    'VITE_ENABLE_CSP',
    'VITE_ENABLE_SECURITY_HEADERS',
  ];
  
  booleanVars.forEach((varName) => {
    const value = import.meta.env[varName];
    if (value && !['true', 'false', '1', '0'].includes(value.toLowerCase())) {
      warnings.push(`${varName} should be 'true' or 'false', got '${value}'`);
    }
  });
  
  // Add informational messages
  if (isDevelopment) {
    info.push('Running in development mode');
    if (import.meta.env.VITE_ENABLE_DEVTOOLS === 'true') {
      info.push('Development tools enabled');
    }
  }
  
  if (isProduction) {
    info.push('Running in production mode');
    if (import.meta.env.VITE_ENABLE_CSP === 'true') {
      info.push('Content Security Policy enabled');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
  };
};

// Helper function to validate URLs
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Get validated environment configuration
export const getEnvConfig = (): EnvConfig => {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error('Environment validation failed:', validation.errors);
    
    // In development, show toast notifications for errors
    if (import.meta.env.VITE_NODE_ENV === 'development') {
      validation.errors.forEach(error => {
        toast.error(`Config Error: ${error}`, { duration: 10000 });
      });
      
      validation.warnings.forEach(warning => {
        toast(`Config Warning: ${warning}`, { 
          duration: 8000,
          icon: '⚠️',
        });
      });
    }
    
    // In production, throw error to prevent app from running with invalid config
    if (import.meta.env.VITE_NODE_ENV === 'production') {
      throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
    }
  } else {
    // Show warnings even if validation passes
    if (validation.warnings.length > 0) {
      console.warn('Environment validation warnings:', validation.warnings);
      
      if (import.meta.env.VITE_NODE_ENV === 'development') {
        validation.warnings.forEach(warning => {
          toast(`Config Warning: ${warning}`, { 
            duration: 6000,
            icon: '⚠️',
          });
        });
      }
    }
    
    // Show info messages in development
    if (import.meta.env.VITE_NODE_ENV === 'development' && validation.info.length > 0) {
      console.info('Environment info:', validation.info);
    }
  }
  
  return {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    VITE_CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    VITE_CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
    VITE_ENABLE_SENTRY: import.meta.env.VITE_ENABLE_SENTRY,
    VITE_ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS,
    VITE_NODE_ENV: import.meta.env.VITE_NODE_ENV,
    GENERATE_SOURCEMAP: import.meta.env.GENERATE_SOURCEMAP,
    USE_CDN: import.meta.env.USE_CDN,
    ANALYZE: import.meta.env.ANALYZE,
    VITE_ENABLE_CSP: import.meta.env.VITE_ENABLE_CSP,
    VITE_ENABLE_SECURITY_HEADERS: import.meta.env.VITE_ENABLE_SECURITY_HEADERS,
  };
};

// Security utilities
export const SecurityUtils = {
  // Check if running in development mode
  isDevelopment: () => import.meta.env.VITE_NODE_ENV === 'development',
  
  // Check if running in production mode
  isProduction: () => import.meta.env.VITE_NODE_ENV === 'production',
  
  // Check if feature is enabled
  isFeatureEnabled: (feature: string): boolean => {
    const value = import.meta.env[`VITE_ENABLE_${feature.toUpperCase()}`];
    return value === 'true' || value === '1';
  },
  
  // Sanitize sensitive data for logging
  sanitizeForLogging: (data: any): any => {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sensitiveKeys = [
      'password',
      'token',
      'key',
      'secret',
      'auth',
      'credential',
      'api_key',
      'access_token',
      'refresh_token',
      'stripe',
      'cloudinary',
    ];
    
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = SecurityUtils.sanitizeForLogging(sanitized[key]);
      }
    });
    
    return sanitized;
  },
  
  // Generate Content Security Policy
  generateCSP: () => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "connect-src 'self' https://api.stripe.com https://res.cloudinary.com wss: ws:",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];
    
    return csp.join('; ');
  },
  
  // Validate external URLs before redirecting
  isAllowedExternalUrl: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const allowedDomains = [
        'stripe.com',
        'cloudinary.com',
        'github.com',
        'linkedin.com',
        'twitter.com',
        'facebook.com',
      ];
      
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  },
  
  // Rate limiting for client-side actions
  createRateLimiter: (maxRequests: number, windowMs: number) => {
    const requests: number[] = [];
    
    return () => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Remove old requests
      while (requests.length > 0 && requests[0] < windowStart) {
        requests.shift();
      }
      
      // Check if limit exceeded
      if (requests.length >= maxRequests) {
        return false;
      }
      
      // Add current request
      requests.push(now);
      return true;
    };
  },
  
  // Environment-specific logging
  log: (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    const sanitizedData = data ? SecurityUtils.sanitizeForLogging(data) : undefined;
    
    if (SecurityUtils.isDevelopment()) {
      console[level](`[${level.toUpperCase()}] ${message}`, sanitizedData);
    } else if (level === 'error') {
      // In production, only log errors
      console.error(`[ERROR] ${message}`, sanitizedData);
    }
  },
};

// Initialize environment validation on module load
let envConfig: EnvConfig;

try {
  envConfig = getEnvConfig();
  
  // Log successful initialization
  SecurityUtils.log('info', 'Environment configuration initialized successfully', {
    environment: envConfig.VITE_NODE_ENV,
    apiUrl: envConfig.VITE_API_BASE_URL,
    appName: envConfig.VITE_APP_NAME,
    version: envConfig.VITE_APP_VERSION,
  });
} catch (error) {
  console.error('Failed to initialize environment configuration:', error);
  throw error;
}

export { envConfig };