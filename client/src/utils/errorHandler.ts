import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  statusCode?: number;
  errors?: Array<{ field: string; message: string }>;
}

export class ErrorHandler {
  /**
   * Handle any error and convert it to ApiError format
   */
  static handle(error: unknown): ApiError {
    if (error instanceof AxiosError) {
      return this.handleAxiosError(error);
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        statusCode: 500,
        code: 'UNKNOWN_ERROR',
      };
    }

    return {
      message: 'An unexpected error occurred',
      statusCode: 500,
      code: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Handle Axios-specific errors
   */
  private static handleAxiosError(error: AxiosError): ApiError {
    const response = error.response;

    // Network error (no response)
    if (!response) {
      if (error.code === 'ECONNABORTED') {
        return {
          message: 'Request timeout. Please try again.',
          code: 'TIMEOUT',
        };
      }

      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }

    const data = response.data as any;

    // Map HTTP status codes to user-friendly messages
    switch (response.status) {
      case 400:
        return {
          message: data?.message || 'Invalid request. Please check your input.',
          code: 'BAD_REQUEST',
          field: data?.field,
          errors: data?.errors,
          statusCode: 400,
        };

      case 401:
        return {
          message: data?.message || 'Please log in to continue',
          code: 'UNAUTHORIZED',
          statusCode: 401,
        };

      case 403:
        return {
          message: data?.message || "You don't have permission to perform this action",
          code: 'FORBIDDEN',
          statusCode: 403,
        };

      case 404:
        return {
          message: data?.message || 'The requested resource was not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        };

      case 409:
        return {
          message: data?.message || 'This resource already exists',
          code: 'CONFLICT',
          statusCode: 409,
        };

      case 422:
        return {
          message: data?.message || 'Validation failed. Please check your input.',
          code: 'VALIDATION_ERROR',
          field: data?.field,
          errors: data?.errors,
          statusCode: 422,
        };

      case 429:
        return {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT',
          statusCode: 429,
        };

      case 500:
        return {
          message: 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
          statusCode: 500,
        };

      case 502:
        return {
          message: 'Service temporarily unavailable. Please try again.',
          code: 'BAD_GATEWAY',
          statusCode: 502,
        };

      case 503:
        return {
          message: 'Service under maintenance. Please try again later.',
          code: 'SERVICE_UNAVAILABLE',
          statusCode: 503,
        };

      default:
        return {
          message: data?.message || 'An error occurred. Please try again.',
          code: 'UNKNOWN_ERROR',
          statusCode: response.status,
        };
    }
  }

  /**
   * Show error as toast notification
   */
  static showToast(error: ApiError, duration = 4000) {
    toast.error(error.message, {
      duration,
      position: 'top-right',
      style: {
        maxWidth: '500px',
      },
    });
  }

  /**
   * Handle error and show toast notification
   */
  static handleAndShow(error: unknown, duration?: number): ApiError {
    const apiError = this.handle(error);
    this.showToast(apiError, duration);
    return apiError;
  }

  /**
   * Get user-friendly error message
   */
  static getMessage(error: unknown): string {
    return this.handle(error).message;
  }

  /**
   * Check if error is a specific type
   */
  static isNetworkError(error: unknown): boolean {
    const apiError = this.handle(error);
    return apiError.code === 'NETWORK_ERROR' || apiError.code === 'TIMEOUT';
  }

  static isAuthError(error: unknown): boolean {
    const apiError = this.handle(error);
    return apiError.code === 'UNAUTHORIZED' || apiError.code === 'FORBIDDEN';
  }

  static isValidationError(error: unknown): boolean {
    const apiError = this.handle(error);
    return apiError.code === 'VALIDATION_ERROR' || apiError.code === 'BAD_REQUEST';
  }

  /**
   * Log error to console (and potentially to monitoring service)
   */
  static log(error: unknown, context?: string) {
    const apiError = this.handle(error);

    console.error('[ErrorHandler]', {
      context,
      error: apiError,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send to error monitoring service (e.g., Sentry)
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, { extra: { context, apiError } });
    // }
  }
}
