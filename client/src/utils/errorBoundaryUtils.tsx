import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  level?: 'page' | 'component' | 'section';
}

// HOC for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) => {
  const WrappedComponent = (props: P) => {
    // Import ErrorBoundary dynamically to avoid circular dependency
    const { ErrorBoundary } = require('@/components/ErrorBoundary');
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for programmatic error boundary reset
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<{
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({ children, onError }) => {
  const { ErrorBoundary } = require('@/components/ErrorBoundary');
  return (
    <ErrorBoundary
      level="page"
      showErrorDetails={true}
      maxRetries={2}
      resetOnPropsChange={true}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
};

export const ComponentErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({ children, fallback, onError }) => {
  const { ErrorBoundary } = require('@/components/ErrorBoundary');
  return (
    <ErrorBoundary
      level="component"
      showErrorDetails={false}
      maxRetries={3}
      resetOnPropsChange={true}
      fallback={fallback}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
};

export const SectionErrorBoundary: React.FC<{
  children: React.ReactNode;
  sectionName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({ children, onError }) => {
  const { ErrorBoundary } = require('@/components/ErrorBoundary');
  return (
    <ErrorBoundary
      level="section"
      showErrorDetails={false}
      maxRetries={2}
      resetOnPropsChange={false}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
};