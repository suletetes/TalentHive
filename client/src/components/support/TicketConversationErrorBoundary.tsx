import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Error as ErrorIcon, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TicketConversationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('[TICKET CONVERSATION ERROR]', error);
    console.error('[TICKET CONVERSATION ERROR INFO]', errorInfo);
    
    // Check if this is the specific React rendering error we're trying to fix
    if (error.message.includes('Objects are not valid as a React child')) {
      console.error('[TICKET CONVERSATION] Detected object rendering error - this indicates user data is not properly cleaned');
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            bgcolor: 'error.lighter',
            border: 1,
            borderColor: 'error.light',
            borderRadius: 2,
          }}
        >
          <Box sx={{ color: 'error.main', mb: 2 }}>
            <ErrorIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h6" gutterBottom color="error.main">
            Unable to Display Messages
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            There was an error rendering the conversation messages. This may be due to malformed user data.
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<Refresh />}
            onClick={this.handleRetry}
          >
            Try Again
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'left' }}>
              <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem' }}>
                {this.state.error.message}
              </Typography>
            </Box>
          )}
        </Paper>
      );
    }

    return this.props.children;
  }
}