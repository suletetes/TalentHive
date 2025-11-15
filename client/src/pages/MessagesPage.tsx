import { Container, Typography, Box, Paper, List, ListItem, ListItemText, Avatar, ListItemAvatar } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

export const MessagesPage = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Messages
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Communicate with clients and freelancers
      </Typography>
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No conversations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Start a conversation by contacting a freelancer or client
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};
