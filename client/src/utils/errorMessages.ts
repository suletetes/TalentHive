/**
 * User-friendly error message utilities
 */

export interface ApiError {
  status?: number;
  message?: string;
  code?: string;
  details?: any;
}

/**
 * Map API error responses to user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: any): string {
  // Handle axios errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    // Handle validation errors with detailed messages
    if (status === 400 && data?.errors && Array.isArray(data.errors)) {
      // Extract validation error messages
      const errorMessages = data.errors.map((err: any) => err.msg || err.message).filter(Boolean);
      if (errorMessages.length > 0) {
        return errorMessages.join('. ');
      }
    }
    
    // Use server-provided message if available and user-friendly
    if (data?.message && typeof data.message === 'string' && data.message.length < 200) {
      return data.message;
    }
    
    // Fallback to status-based messages
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        // Check if this is a login error
        if (error.config?.url?.includes('/auth/login')) {
          return 'Invalid email or password. Please try again.';
        }
        return 'You need to log in to access this feature.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data. Please refresh and try again.';
      case 422:
        return 'The provided data is invalid. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'A server error occurred. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'The service is temporarily unavailable. Please try again later.';
      default:
        return `An error occurred (${status}). Please try again.`;
    }
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return 'Network connection failed. Please check your internet connection.';
  }
  
  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  // Handle generic errors
  if (error.message && typeof error.message === 'string') {
    // Don't expose technical error messages to users
    const technicalKeywords = ['axios', 'fetch', 'XMLHttpRequest', 'CORS', 'ERR_'];
    const isTechnical = technicalKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (!isTechnical && error.message.length < 200) {
      return error.message;
    }
  }
  
  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Extract validation errors from API response
 */
export function getValidationErrors(error: any): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (error.response?.data?.errors) {
    const apiErrors = error.response.data.errors;
    
    // Handle array of validation errors
    if (Array.isArray(apiErrors)) {
      apiErrors.forEach((err: any) => {
        if (err.field && err.message) {
          errors[err.field] = err.message;
        }
      });
    }
    
    // Handle object of validation errors
    if (typeof apiErrors === 'object' && !Array.isArray(apiErrors)) {
      Object.entries(apiErrors).forEach(([field, message]) => {
        if (typeof message === 'string') {
          errors[field] = message;
        }
      });
    }
  }
  
  return errors;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  return error.response?.status === 422 || 
         (error.response?.data?.errors && Object.keys(getValidationErrors(error)).length > 0);
}

/**
 * Check if error is a network/connectivity error
 */
export function isNetworkError(error: any): boolean {
  return !error.response || 
         error.code === 'NETWORK_ERROR' || 
         error.message?.includes('Network Error');
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return error.response?.status === 401;
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: any): boolean {
  return error.response?.status === 403;
}

/**
 * Check if error is a rate limiting error
 */
export function isRateLimitError(error: any): boolean {
  return error.response?.status === 429;
}

/**
 * Get retry delay for rate limit errors
 */
export function getRateLimitRetryDelay(error: any): number {
  if (isRateLimitError(error)) {
    const retryAfter = error.response?.headers['retry-after'];
    if (retryAfter) {
      return parseInt(retryAfter) * 1000; // Convert to milliseconds
    }
  }
  return 5000; // Default 5 seconds
}

/**
 * Format error for display in toast notifications
 */
export function formatErrorForToast(error: any): { message: string; type: 'error' | 'warning' } {
  if (isNetworkError(error)) {
    return {
      message: getUserFriendlyErrorMessage(error),
      type: 'warning',
    };
  }
  
  if (isRateLimitError(error)) {
    return {
      message: 'Please slow down and try again in a moment.',
      type: 'warning',
    };
  }
  
  return {
    message: getUserFriendlyErrorMessage(error),
    type: 'error',
  };
}