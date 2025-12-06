import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              py: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                maxWidth: 600,
              }}
            >
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              
              <Typography variant="h4" gutterBottom>
                Oops! Something went wrong
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph>
                We're sorry for the inconvenience. An unexpected error has occurred.
              </Typography>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    textAlign: 'left',
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant="contained"
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
                If this problem persists, please contact support.
              </Typography>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}
