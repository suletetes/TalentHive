import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const FindFreelancersPage: React.FC = () => {
  const navigate = useNavigate();

  // Redirect to freelancers page
  React.useEffect(() => {
    navigate('/freelancers');
  }, [navigate]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography variant="h5" color="text.secondary">
          Redirecting to freelancers...
        </Typography>
      </Box>
    </Container>
  );
};
