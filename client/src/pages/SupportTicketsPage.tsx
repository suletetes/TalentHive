import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SupportTicketList } from '@/components/support/SupportTicketList';

export const SupportTicketsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Support Tickets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage your support tickets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/dashboard/support/new')}
        >
          Create Ticket
        </Button>
      </Box>

      <SupportTicketList />
    </Container>
  );
};
