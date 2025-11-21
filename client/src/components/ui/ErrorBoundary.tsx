import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { BugReport, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              bgcolor: 'error.lighter',
              border: 1,
              borderColor: 'error.light',
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                color: 'error.main',
                mb: 2,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <BugReport sx={{ fontSize: 64 }} />
            </Box>
            <Typography variant="h5" gutterBottom fontWeight={600} color="error.main">
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're sorry for the inconvenience. An unexpected error occurred.
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<Refresh />}
              onClick={this.handleReset}
            >
              Reload Page
            </Button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mt: 4,
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  textAlign: 'left',
                  overflow: 'auto',
                }}
              >
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Error Details (Development Only):
                </Typography>
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}
