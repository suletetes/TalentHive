import React from 'react';
import { Alert, Snackbar, Box } from '@mui/material';
import { WifiOff as WifiOffIcon } from '@mui/icons-material';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOffline } = useOnlineStatus();

  return (
    <Snackbar
      open={isOffline}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 90, sm: 24 } }}
    >
      <Alert
        severity="error"
        icon={<WifiOffIcon />}
        sx={{
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Box>
          <strong>No internet connection</strong>
          <br />
          Some features may not be available
        </Box>
      </Alert>
    </Snackbar>
  );
};
