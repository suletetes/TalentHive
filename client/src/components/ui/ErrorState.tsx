import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Refresh as RefreshIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import { ErrorHandler } from '@/utils/errorHandler';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  showDetails?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  title,
  showDetails = false,
}) => {
  const apiError = ErrorHandler.handle(error);
  const isNetworkError = ErrorHandler.isNetworkError(error);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        textAlign: 'center',
        bgcolor: 'grey.50',
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {isNetworkError ? (
          <WifiOffIcon sx={{ fontSize: 60, color: 'error.main' }} />
        ) : (
          <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />
        )}

        <Typography variant="h6" component="h2">
          {title || 'Something went wrong'}
        </Typography>

        <Typography variant="body2" color="text.secondary" maxWidth={400}>
          {apiError.message}
        </Typography>

        {showDetails && import.meta.env.DEV && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'white',
              borderRadius: 1,
              textAlign: 'left',
              width: '100%',
              maxWidth: 600,
              maxHeight: 150,
              overflow: 'auto',
            }}
          >
            <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(apiError, null, 2)}
            </Typography>
          </Box>
        )}

        {onRetry && (
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        )}
      </Box>
    </Paper>
  );
};

// Inline error state for smaller components
export const InlineErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const apiError = ErrorHandler.handle(error);

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'error.light',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ErrorIcon sx={{ color: 'error.main' }} />
        <Typography variant="body2" color="error.dark">
          {apiError.message}
        </Typography>
      </Box>
      {onRetry && (
        <Button size="small" variant="outlined" color="error" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Box>
  );
};
