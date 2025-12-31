import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * API Error interface
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Type guard to check if error is an AxiosError
 */
export const isAxiosError = (error: unknown): error is AxiosError => {
  return error instanceof AxiosError;
};

/**
 * Type guard to check if error is a standard Error
 */
export const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

/**
 * ErrorHandler class for centralized error handling
 */
export class ErrorHandler {
  static handle(error: unknown): ApiError {
    const message = getErrorMessage(error);
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const code = isAxiosError(error) ? error.code : undefined;
    
    return {
      message,
      status,
      code,
    };
  }

  static isNetworkError(error: unknown): boolean {
    return isNetworkError(error);
  }

  static isServerError(error: unknown): boolean {
    return isServerError(error);
  }

  static showToast(error: ApiError): void {
    toast.error(error.message);
  }

  static logError(error: unknown, context?: string): void {
    logError(error, context);
  }
}

/**
 * ValidationErrorHandler class for backward compatibility
 */
export class ValidationErrorHandler {
  static extractFieldErrors(error: ApiError): Record<string, string> {
    if (error.details && typeof error.details === 'object') {
      return error.details as Record<string, string>;
    }
    return {};
  }
}

/**
 * Extract user-friendly error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    // API error response
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    // HTTP status errors
    if (error.response?.status === 401) {
      return 'Your session has expired. Please login again.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.response?.status === 500) {
      return 'A server error occurred. Please try again later.';
    }
    
    // Network errors
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your internet connection.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
    
    return error.message || 'An unexpected error occurred';
  }

  if (isError(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
};

/**
 * Log error for debugging (in development) or tracking (in production)
 */
export const logError = (error: unknown, context?: string) => {
  const errorMessage = getErrorMessage(error);
  const timestamp = new Date().toISOString();

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${timestamp}] Error${context ? ` in ${context}` : ''}:`, error);
  } else {
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { tags: { context } });
    console.error(`[${timestamp}] ${errorMessage}`);
  }
};

/**
 * Handle async errors with try-catch wrapper
 */
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context?: string
): Promise<[T | null, string | null]> => {
  try {
    const result = await asyncFn();
    return [result, null];
  } catch (error) {
    logError(error, context);
    return [null, getErrorMessage(error)];
  }
};

/**
 * Retry failed async operations
 */
export const retryAsync = async <T>(
  asyncFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
};

/**
 * Validate form data and return errors
 */
export const validateFormData = (
  data: Record<string, any>,
  rules: Record<string, (value: any) => string | null>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.entries(rules).forEach(([field, validator]) => {
    const error = validator(data[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

/**
 * Check if error is a specific type
 */
export const isNetworkError = (error: unknown): boolean => {
  return isAxiosError(error) && error.code === 'ERR_NETWORK';
};

export const isAuthError = (error: unknown): boolean => {
  return isAxiosError(error) && error.response?.status === 401;
};

export const isForbiddenError = (error: unknown): boolean => {
  return isAxiosError(error) && error.response?.status === 403;
};

export const isNotFoundError = (error: unknown): boolean => {
  return isAxiosError(error) && error.response?.status === 404;
};

export const isServerError = (error: unknown): boolean => {
  return isAxiosError(error) && 
    error.response?.status !== undefined && 
    error.response.status >= 500;
};
