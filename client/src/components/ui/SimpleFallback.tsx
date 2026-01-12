import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface SimpleFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export const SimpleFallback: React.FC<SimpleFallbackProps> = ({
  message = 'Something went wrong',
  onRetry
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
      p={3}
    >
      <Typography variant="h6" color="error" gutterBottom>
        {message}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Please try refreshing the page or contact support if the problem persists.
      </Typography>
      {onRetry && (
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
};

export default SimpleFallback;