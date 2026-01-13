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
    <Container maxWidth="xl" sx={{ py: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Typography variant="h4" gutterBottom>
          Messages
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Communicate with clients and freelancers
        </Typography>
      </Box>
      <Paper 
        elevation={2} 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0, // Important for flex children
        }}
      >
        <MessagingInterface />
      </Paper>
    </Container>
  );
};

export default MessagesPage;
