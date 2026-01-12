// Enhanced error boundary components for better error handling
import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
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
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  level?: 'page' | 'component' | 'section';
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error display system
    const errorId = ErrorDisplayManager.displayError(error, {
      severity: ErrorSeverity.HIGH,
      context: `error-boundary-${this.props.level || 'component'}`,
    });

    this.setState({
      errorInfo,
      errorId,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, children } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when props change (if enabled)
    if (hasError && resetOnPropsChange && prevProps.children !== children) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      retryCount: this.state.retryCount + 1,
    });
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.resetErrorBoundary();
    } else {
      // Show message about max retries reached
      ErrorDisplayManager.displayError(
        'Maximum retry attempts reached. Please refresh the page.',
        {
          severity: ErrorSeverity.HIGH,
          context: 'error-boundary-max-retries',
        }
      );
    }
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  renderErrorFallback() {
    const { error, errorInfo, showDetails, retryCount } = this.state;
    const { maxRetries = 3, level = 'component', showErrorDetails = true } = this.props;

    const canRetry = retryCount < maxRetries;
    const isPageLevel = level === 'page';

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: isPageLevel ? '100vh' : '200px',
          padding: 3,
        }}
      >
        <Card sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BugIcon color="error" sx={{ mr: 1, fontSize: 32 }} />
              <Typography variant="h5" color="error">
                {isPageLevel ? 'Application Error' : 'Component Error'}
              </Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {isPageLevel
                ? 'Something went wrong with the application. We apologize for the inconvenience.'
                : 'This component encountered an error and could not be displayed.'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Error:</strong> {error.message}
                </Typography>
              </Alert>
            )}

            {showErrorDetails && error && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <IconButton
                    onClick={this.toggleDetails}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    {showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                  <Typography variant="body2" color="text.secondary">
                    {showDetails ? 'Hide' : 'Show'} Error Details
                  </Typography>
                </Box>

                <Collapse in={showDetails}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                        <strong>Stack Trace:</strong>
                      </Typography>
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxHeight: 200,
                          overflow: 'auto',
                          backgroundColor: 'grey.100',
                          padding: 1,
                          borderRadius: 1,
                        }}
                      >
                        {error.stack}
                      </Typography>

                      {errorInfo && (
                        <>
                          <Typography variant="caption" component="div" sx={{ mt: 2, mb: 1 }}>
                            <strong>Component Stack:</strong>
                          </Typography>
                          <Typography
                            variant="caption"
                            component="pre"
                            sx={{
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              maxHeight: 200,
                              overflow: 'auto',
                              backgroundColor: 'grey.100',
                              padding: 1,
                              borderRadius: 1,
                            }}
                          >
                            {errorInfo.componentStack}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Collapse>
              </>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {canRetry && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                >
                  Try Again ({maxRetries - retryCount} attempts left)
                </Button>
              )}

              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={this.handleRefreshPage}
              >
                Refresh Page
              </Button>
            </Box>

            {!canRetry && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Maximum retry attempts reached. Please refresh the page or contact support if the problem persists.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      return fallback || this.renderErrorFallback();
    }

    return children;
  }
}

// Specialized error boundaries for different contexts moved to @/utils/errorBoundaryUtils for Fast Refresh compatibility
export { 
  withErrorBoundary, 
  useErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
  SectionErrorBoundary
} from '@/utils/errorBoundaryUtils';