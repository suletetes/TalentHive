import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

export const PaymentErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('error') || 'An error occurred during payment processing';
  const paymentIntentId = searchParams.get('payment_intent');

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <ErrorIcon
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 2,
            }}
          />

          <Typography variant="h4" gutterBottom>
            Payment Failed
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            Unfortunately, your payment could not be processed.
          </Typography>

          <Alert severity="error" sx={{ my: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Error:</strong> {decodeURIComponent(errorMessage)}
            </Typography>
          </Alert>

          {paymentIntentId && (
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Payment ID:</strong> {paymentIntentId}
              </Typography>
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" paragraph>
            Please check your payment details and try again. If the problem persists, contact support.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate(-1)}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => navigate('/contact')}
            >
              Contact Support
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentErrorPage;
