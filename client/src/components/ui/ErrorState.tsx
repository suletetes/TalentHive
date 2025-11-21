import React from 'react';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { Error, Refresh, WifiOff, BugReport } from '@mui/icons-material';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  type?: 'network' | 'server' | 'notFound' | 'generic';
  showDetails?: boolean;
  details?: string;
}

const errorConfig = {
  network: {
    icon: <WifiOff sx={{ fontSize: 64 }} />,
    defaultTitle: 'Network Error',
    defaultMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
  },
  server: {
    icon: <BugReport sx={{ fontSize: 64 }} />,
    defaultTitle: 'Server Error',
    defaultMessage: 'Something went wrong on our end. Our team has been notified and is working on a fix.',
  },
  notFound: {
    icon: <Error sx={{ fontSize: 64 }} />,
    defaultTitle: 'Not Found',
    defaultMessage: 'The resource you are looking for could not be found.',
  },
  generic: {
    icon: <Error sx={{ fontSize: 64 }} />,
    defaultTitle: 'Something Went Wrong',
    defaultMessage: 'An unexpected error occurred. Please try again.',
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  type = 'generic',
  showDetails = false,
  details,
}) => {
  const config = errorConfig[type];

  return (
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
        {config.icon}
      </Box>
      <Typography variant="h6" gutterBottom fontWeight={600} color="error.main">
        {title || config.defaultTitle}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
        {message || config.defaultMessage}
      </Typography>
      {onRetry && (
        <Button
          variant="contained"
          color="error"
          startIcon={<Refresh />}
          onClick={onRetry}
          sx={{ mt: 1 }}
        >
          {retryLabel}
        </Button>
      )}
      {showDetails && details && (
        <Alert severity="error" sx={{ mt: 3, textAlign: 'left' }}>
          <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {details}
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};
