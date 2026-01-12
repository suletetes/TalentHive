// Enhanced Error Boundary components for consistent error handling
import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';
import { ErrorDisplayManager, ErrorSeverity } from '@/utils/errorDisplay';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReload?: boolean;
  context?: string;
  level?: 'page' | 'section' | 'component';
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to our error display system
    const standardizedError = ErrorDisplayManager.displayError(
      error,
      {
        type: 'alert' as any,
        severity: ErrorSeverity.HIGH,
        showRetry: true,
      },
      this.props.context || 'Error Boundary',
      'Component render'
    );

    this.setState({
      error,
      errorInfo,
      errorId: standardizedError.id,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to console for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render error UI based on level
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { level = 'component', showReload = true, context } = this.props;
    const { error, errorInfo, showDetails } = this.state;

    const errorTitle = this.getErrorTitle(level);
    const errorMessage = this.getErrorMessage(error);

    if (level === 'page') {
      return this.renderPageError(errorTitle, errorMessage);
    }

    if (level === 'section') {
      return this.renderSectionError(errorTitle, errorMessage);
    }

    return this.renderComponentError(errorTitle, errorMessage);
  }

  private renderPageError(title: string, message: string) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 3,
          textAlign: 'center',
        }}
      >
        <BugIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" color="error" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
          {message}
        </Typography>
        
        {this.renderErrorActions()}
        {this.renderErrorDetails()}
      </Box>
    );
  }

  private renderSectionError(title: string, message: string) {
    return (
      <Card sx={{ m: 2 }}>
        <CardContent>
          <Alert severity="error">
            <AlertTitle>{title}</AlertTitle>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {message}
            </Typography>
            {this.renderErrorActions()}
          </Alert>
          {this.renderErrorDetails()}
        </CardContent>
      </Card>
    );
  }

  private renderComponentError(title: string, message: string) {
    return (
      <Alert 
        severity="error" 
        sx={{ m: 1 }}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" onClick={this.handleRetry}>
              Retry
            </Button>
            <IconButton size="small" onClick={this.toggleDetails}>
              {this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        }
      >
        <AlertTitle>{title}</AlertTitle>
        <Typography variant="body2">
          {message}
        </Typography>
        {this.renderErrorDetails()}
      </Alert>
    );
  }

  private renderErrorActions() {
    const { showReload } = this.props;

    return (
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={this.handleRetry}
        >
          Try Again
        </Button>
        {showReload && (
          <Button
            variant="outlined"
            onClick={this.handleReload}
          >
            Reload Page
          </Button>
        )}
        <Button
          variant="text"
          size="small"
          onClick={this.toggleDetails}
          startIcon={this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {this.state.showDetails ? 'Hide' : 'Show'} Details
        </Button>
      </Box>
    );
  }

  private renderErrorDetails() {
    const { error, errorInfo, showDetails } = this.state;

    return (
      <Collapse in={showDetails}>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Error Details:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ 
            fontSize: '0.75rem', 
            overflow: 'auto',
            maxHeight: 200,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {error?.message}
            {error?.stack && `\n\nStack Trace:\n${error.stack}`}
            {errorInfo?.componentStack && `\n\nComponent Stack:${errorInfo.componentStack}`}
          </Typography>
        </Box>
      </Collapse>
    );
  }

  private getErrorTitle(level: string): string {
    switch (level) {
      case 'page':
        return 'Page Error';
      case 'section':
        return 'Section Error';
      case 'component':
        return 'Component Error';
      default:
        return 'Something went wrong';
    }
  }

  private getErrorMessage(error: Error | null): string {
    if (!error) return 'An unexpected error occurred.';

    // Provide user-friendly messages for common errors
    const message = error.message.toLowerCase();
    
    if (message.includes('chunk')) {
      return 'Failed to load application resources. Please refresh the page.';
    }
    
    if (message.includes('network')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    if (message.includes('unauthorized')) {
      return 'You are not authorized to access this resource. Please log in and try again.';
    }

    // Return original message for development, generic message for production
    if (process.env.NODE_ENV === 'development') {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
}

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page" context="Page" showReload>
    {children}
  </ErrorBoundary>
);

export const SectionErrorBoundary: React.FC<{ 
  children: ReactNode; 
  context?: string;
}> = ({ children, context }) => (
  <ErrorBoundary level="section" context={context} showReload={false}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ 
  children: ReactNode; 
  context?: string;
}> = ({ children, context }) => (
  <ErrorBoundary level="component" context={context} showReload={false}>
    {children}
  </ErrorBoundary>
);

// HOC for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for programmatic error handling
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