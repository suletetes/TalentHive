// Standardized error display system for consistent UX
import { toast } from 'react-hot-toast';
import { ApiError } from '@/types/api';

export enum ErrorDisplayType {
  TOAST = 'toast',
  ALERT = 'alert',
  INLINE = 'inline',
  MODAL = 'modal',
  BANNER = 'banner',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorDisplayConfig {
  type: ErrorDisplayType;
  severity: ErrorSeverity;
  duration?: number;
  dismissible?: boolean;
  showRetry?: boolean;
  context?: string;
}

export interface StandardizedError {
  id: string;
  message: string;
  description?: string;
  code?: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: string;
  stack?: string;
  userAction?: string;
  retryable?: boolean;
}

export class ErrorDisplayManager {
  private static errorHistory: StandardizedError[] = [];
  private static maxHistorySize = 50;

  // Standardize error from various sources
  static standardizeError(
    error: any,
    context?: string,
    userAction?: string
  ): StandardizedError {
    const timestamp = new Date();
    const id = `error_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`;

    // Handle different error types
    if (error instanceof Error) {
      return {
        id,
        message: error.message,
        severity: this.determineSeverity(error),
        timestamp,
        context,
        stack: error.stack,
        userAction,
        retryable: this.isRetryable(error),
      };
    }

    // Handle API errors
    if (this.isApiError(error)) {
      return {
        id,
        message: error.message || 'An API error occurred',
        description: error.details,
        code: error.code,
        severity: this.getApiErrorSeverity(error.status),
        timestamp,
        context,
        userAction,
        retryable: this.isApiErrorRetryable(error.status),
      };
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        id,
        message: error,
        severity: ErrorSeverity.MEDIUM,
        timestamp,
        context,
        userAction,
        retryable: false,
      };
    }

    // Handle unknown errors
    return {
      id,
      message: 'An unexpected error occurred',
      description: JSON.stringify(error),
      severity: ErrorSeverity.HIGH,
      timestamp,
      context,
      userAction,
      retryable: false,
    };
  }

  // Display error using appropriate method
  static displayError(
    error: any,
    config: Partial<ErrorDisplayConfig> = {},
    context?: string,
    userAction?: string
  ): StandardizedError {
    const standardizedError = this.standardizeError(error, context, userAction);
    
    // Add to history
    this.addToHistory(standardizedError);

    // Determine display configuration
    const displayConfig: ErrorDisplayConfig = {
      type: ErrorDisplayType.TOAST,
      severity: standardizedError.severity,
      duration: this.getDefaultDuration(standardizedError.severity),
      dismissible: true,
      showRetry: standardizedError.retryable,
      ...config,
    };

    // Display based on type
    switch (displayConfig.type) {
      case ErrorDisplayType.TOAST:
        this.showToast(standardizedError, displayConfig);
        break;
      case ErrorDisplayType.ALERT:
        this.showAlert(standardizedError, displayConfig);
        break;
      case ErrorDisplayType.INLINE:
        // Inline errors are handled by components
        break;
      case ErrorDisplayType.MODAL:
        this.showModal(standardizedError, displayConfig);
        break;
      case ErrorDisplayType.BANNER:
        this.showBanner(standardizedError, displayConfig);
        break;
    }

    return standardizedError;
  }

  // Show toast notification
  private static showToast(error: StandardizedError, config: ErrorDisplayConfig) {
    const toastOptions = {
      duration: config.duration || 4000,
      id: error.id,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(error.message, toastOptions);
        break;
      case ErrorSeverity.HIGH:
        toast.error(error.message, toastOptions);
        break;
      case ErrorSeverity.MEDIUM:
        toast.error(error.message, toastOptions);
        break;
      case ErrorSeverity.LOW:
        toast(error.message, toastOptions);
        break;
    }
  }

  // Show alert (for components to use)
  private static showAlert(error: StandardizedError, config: ErrorDisplayConfig) {
    // This will be used by React components
    console.warn('Alert error display:', error);
  }

  // Show modal (for critical errors)
  private static showModal(error: StandardizedError, config: ErrorDisplayConfig) {
    // This would integrate with a modal system
    console.error('Modal error display:', error);
  }

  // Show banner (for persistent errors)
  private static showBanner(error: StandardizedError, config: ErrorDisplayConfig) {
    // This would integrate with a banner system
    console.warn('Banner error display:', error);
  }

  // Determine error severity
  private static determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorSeverity.HIGH;
    }
    
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorSeverity.HIGH;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.MEDIUM;
  }

  // Check if error is retryable
  private static isRetryable(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('connection');
  }

  // Check if it's an API error
  private static isApiError(error: any): error is ApiError {
    return error && typeof error === 'object' && 'status' in error;
  }

  // Get API error severity based on status code
  private static getApiErrorSeverity(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status === 401 || status === 403) return ErrorSeverity.HIGH;
    if (status >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  // Check if API error is retryable
  private static isApiErrorRetryable(status: number): boolean {
    return status >= 500 || status === 429 || status === 408;
  }

  // Get default duration based on severity
  private static getDefaultDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return 8000;
      case ErrorSeverity.HIGH: return 6000;
      case ErrorSeverity.MEDIUM: return 4000;
      case ErrorSeverity.LOW: return 3000;
      default: return 4000;
    }
  }

  // Add error to history
  private static addToHistory(error: StandardizedError) {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  // Get error history
  static getErrorHistory(): StandardizedError[] {
    return [...this.errorHistory];
  }

  // Clear error history
  static clearErrorHistory() {
    this.errorHistory = [];
  }

  // Get errors by context
  static getErrorsByContext(context: string): StandardizedError[] {
    return this.errorHistory.filter(error => error.context === context);
  }

  // Get recent errors
  static getRecentErrors(minutes: number = 5): StandardizedError[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorHistory.filter(error => error.timestamp > cutoff);
  }
}

// Convenience functions for common error scenarios
export const ErrorDisplay = {
  // Network errors
  networkError: (error: any, context?: string) => {
    return ErrorDisplayManager.displayError(error, {
      type: ErrorDisplayType.TOAST,
      severity: ErrorSeverity.HIGH,
      showRetry: true,
    }, context, 'Network request');
  },

  // Validation errors
  validationError: (error: any, context?: string) => {
    return ErrorDisplayManager.displayError(error, {
      type: ErrorDisplayType.INLINE,
      severity: ErrorSeverity.MEDIUM,
      showRetry: false,
    }, context, 'Form validation');
  },

  // Authentication errors
  authError: (error: any, context?: string) => {
    return ErrorDisplayManager.displayError(error, {
      type: ErrorDisplayType.TOAST,
      severity: ErrorSeverity.HIGH,
      duration: 6000,
      showRetry: false,
    }, context, 'Authentication');
  },

  // Critical system errors
  criticalError: (error: any, context?: string) => {
    return ErrorDisplayManager.displayError(error, {
      type: ErrorDisplayType.MODAL,
      severity: ErrorSeverity.CRITICAL,
      dismissible: false,
      showRetry: true,
    }, context, 'System error');
  },

  // Form submission errors
  formError: (error: any, context?: string) => {
    return ErrorDisplayManager.displayError(error, {
      type: ErrorDisplayType.ALERT,
      severity: ErrorSeverity.MEDIUM,
      showRetry: true,
    }, context, 'Form submission');
  },

  // File upload errors
  uploadError: (error: any, context?: string) => {
    return ErrorDisplayManager.displayError(error, {
      type: ErrorDisplayType.TOAST,
      severity: ErrorSeverity.MEDIUM,
      duration: 5000,
      showRetry: true,
    }, context, 'File upload');
  },
};

// React hook for error handling
export const useErrorHandler = () => {
  const handleError = (
    error: any,
    config?: Partial<ErrorDisplayConfig>,
    context?: string,
    userAction?: string
  ) => {
    return ErrorDisplayManager.displayError(error, config, context, userAction);
  };

  const getErrorHistory = () => ErrorDisplayManager.getErrorHistory();
  const clearHistory = () => ErrorDisplayManager.clearErrorHistory();
  const getRecentErrors = (minutes?: number) => ErrorDisplayManager.getRecentErrors(minutes);

  return {
    handleError,
    getErrorHistory,
    clearHistory,
    getRecentErrors,
    // Convenience methods
    networkError: ErrorDisplay.networkError,
    validationError: ErrorDisplay.validationError,
    authError: ErrorDisplay.authError,
    criticalError: ErrorDisplay.criticalError,
    formError: ErrorDisplay.formError,
    uploadError: ErrorDisplay.uploadError,
  };
};