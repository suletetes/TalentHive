import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export const CreateProfilePage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          Create Your Profile
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Complete your profile to get started on TalentHive
        </Typography>
        
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/dashboard/profile"
          >
            Go to Profile Settings
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            to="/"
          >
            Back to Home
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
