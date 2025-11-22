import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

export const VerificationSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const verificationType = searchParams.get('type') || 'email';
  const [isVerifying, setIsVerifying] = React.useState(true);

  useEffect(() => {
    // Simulate verification process
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isVerifying) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircleIcon
            sx={{
              fontSize: 80,
              color: 'success.main',
              mb: 2,
            }}
          />

          <Typography variant="h4" gutterBottom>
            Verification Successful!
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            Your {verificationType} has been verified successfully. Your account is now fully verified.
          </Typography>

          <Alert severity="success" sx={{ my: 3 }}>
            <Typography variant="body2">
              You can now access all platform features and build trust with clients and freelancers.
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary" paragraph>
            A blue verification badge will now appear on your profile.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard/profile')}
            >
              View Profile
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};
