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
import { usePaymentHistory } from '@/hooks/api/usePayments';

export const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const { data: payment, isLoading } = usePaymentHistory();

  useEffect(() => {
    // Auto-redirect after 5 seconds if no payment intent
    if (!paymentIntentId) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentIntentId, navigate]);

  if (isLoading) {
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
            Payment Successful!
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            Your payment has been processed successfully. Your transaction is now complete.
          </Typography>

          {paymentIntentId && (
            <Alert severity="info" sx={{ my: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Payment ID:</strong> {paymentIntentId}
              </Typography>
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" paragraph>
            You will be redirected to your dashboard shortly. If not, click the button below.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard/payments')}
            >
              View Payments
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};
