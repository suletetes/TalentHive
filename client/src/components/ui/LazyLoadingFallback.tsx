import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface LazyLoadingFallbackProps {
  error?: Error;
  retry?: () => void;
  componentName?: string;
}

export const LazyLoadingFallback: React.FC<LazyLoadingFallbackProps> = ({
  error,
  retry,
  componentName = 'Component'
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
      <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
        <Typography variant="h6" gutterBottom>
          Failed to load {componentName}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {error?.message || 'An unexpected error occurred while loading this component.'}
        </Typography>
        {retry && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={retry}
            sx={{ mt: 1 }}
          >
            Try Again
          </Button>
        )}
      </Alert>
    </Box>
  );
};

export default LazyLoadingFallback;