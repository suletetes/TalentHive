import React, { useEffect } from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';
import { MessagingInterface } from '@/components/messaging/MessagingInterface';
import { socketService } from '@/services/socket';

export const MessagesPage: React.FC = () => {
  useEffect(() => {
    // Ensure socket is connected when viewing messages
    if (!socketService.isConnected()) {
      socketService.connect();
    }
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Messages
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Communicate with clients and freelancers
        </Typography>
      </Box>
      <Paper elevation={2} sx={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        <MessagingInterface />
      </Paper>
    </Container>
  );
};

export default MessagesPage;
