import { logger } from './logger';

interface EnvConfig {
  // Database
  MONGODB_URI: string;
  
  // Authentication
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN?: string;
  JWT_REFRESH_EXPIRES_IN?: string;
  
  // Payment
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  
  // Email
  SENDGRID_API_KEY?: string;
  RESEND_API_KEY?: string;
  
  // File Upload
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  
  // Redis (optional)
  REDIS_URL?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;
  
  // CORS
  CORS_ORIGIN?: string;
  CLIENT_URL?: string;
  
  // Server
  PORT?: string;
  NODE_ENV?: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS?: string;
}

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'STRIPE_SECRET_KEY',
];

const conditionallyRequiredEnvVars = [
  {
    condition: () => process.env.NODE_ENV === 'production',
    vars: ['CORS_ORIGIN', 'CLIENT_URL'],
    message: 'CORS_ORIGIN and CLIENT_URL are required in production'
  },
  {
    condition: () => !process.env.SENDGRID_API_KEY && !process.env.RESEND_API_KEY,
    vars: ['SENDGRID_API_KEY', 'RESEND_API_KEY'],
    message: 'Either SENDGRID_API_KEY or RESEND_API_KEY is required for email functionality'
  },
  {
    condition: () => {
      const hasCloudinaryName = !!process.env.CLOUDINARY_CLOUD_NAME;
      const hasCloudinaryKey = !!process.env.CLOUDINARY_API_KEY;
      const hasCloudinarySecret = !!process.env.CLOUDINARY_API_SECRET;
      return hasCloudinaryName || hasCloudinaryKey || hasCloudinarySecret;
    },
    vars: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    message: 'If using Cloudinary, all three variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are required'
  }
];

export function validateEnvironmentVariables(): EnvConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check conditionally required environment variables
  for (const { condition, vars, message } of conditionallyRequiredEnvVars) {
    if (condition()) {
      const missingVars = vars.filter(varName => !process.env[varName]);
      if (missingVars.length === vars.length) {
        errors.push(`${message}. Missing: ${missingVars.join(', ')}`);
      } else if (missingVars.length > 0) {
        warnings.push(`${message}. Missing: ${missingVars.join(', ')}`);
      }
    }
  }

  // Validate specific environment variable formats
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
    errors.push('MONGODB_URI must start with "mongodb://" or "mongodb+srv://"');
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY must start with "sk_"');
  }

  if (process.env.PORT && (isNaN(Number(process.env.PORT)) || Number(process.env.PORT) < 1 || Number(process.env.PORT) > 65535)) {
    errors.push('PORT must be a valid port number (1-65535)');
  }

  // Validate rate limiting variables
  if (process.env.RATE_LIMIT_WINDOW_MS && (isNaN(Number(process.env.RATE_LIMIT_WINDOW_MS)) || Number(process.env.RATE_LIMIT_WINDOW_MS) < 1000)) {
    errors.push('RATE_LIMIT_WINDOW_MS must be a number >= 1000 (milliseconds)');
  }

  if (process.env.RATE_LIMIT_MAX_REQUESTS && (isNaN(Number(process.env.RATE_LIMIT_MAX_REQUESTS)) || Number(process.env.RATE_LIMIT_MAX_REQUESTS) < 1)) {
    errors.push('RATE_LIMIT_MAX_REQUESTS must be a positive number');
  }

  if (process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS && !['true', 'false'].includes(process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS.toLowerCase())) {
    errors.push('RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS must be "true" or "false"');
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Environment variable warnings:');
    warnings.forEach(warning => logger.warn(`  - ${warning}`));
  }

  // Throw error if any required variables are missing
  if (errors.length > 0) {
    logger.error('Environment validation failed:');
    errors.forEach(error => logger.error(`  - ${error}`));
    throw new Error(`Environment validation failed. Please check your environment variables.\n${errors.join('\n')}`);
  }

  // Log successful validation
  logger.info('✅ Environment variables validated successfully');

  // Return typed environment config
  return {
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    CLIENT_URL: process.env.CLIENT_URL,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
  };
}

export function getEnvConfig(): EnvConfig {
  return validateEnvironmentVariables();
}

// Export individual getters for convenience
export const getRequiredEnv = (key: keyof EnvConfig): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

export const getOptionalEnv = (key: keyof EnvConfig, defaultValue?: string): string | undefined => {
  return process.env[key] || defaultValue;
};