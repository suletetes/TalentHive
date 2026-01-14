import React, { useEffect, useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsService } from '@/services/api/payments.service';
import { useToast } from '@/components/ui/ToastProvider';

export const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const transactionId = searchParams.get('transaction');
  const contractId = searchParams.get('contract');
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Confirm payment mutation
  const confirmMutation = useMutation({
    mutationFn: async (intentId: string) => {
      return paymentsService.confirmPayment(intentId);
    },
    onSuccess: () => {
      setConfirmed(true);
      toast.success('Payment confirmed! Funds are now in escrow.');
      // Invalidate contract cache to refresh milestone status
      if (contractId) {
        queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      }
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: any) => {
      // Payment might already be confirmed
      if (err.message?.includes('already') || err.message?.includes('not found')) {
        setConfirmed(true);
      } else {
        toast.error(err.message || 'Failed to confirm payment');
      }
    },
  });

  // Auto-confirm payment if we have a payment intent
  useEffect(() => {
    if (paymentIntentId && !confirmed && !confirming) {
      setConfirming(true);
      confirmMutation.mutate(paymentIntentId);
    }
  }, [paymentIntentId, confirmed, confirming]);

  // Auto-redirect after confirmation
  useEffect(() => {
    if (confirmed) {
      const timer = setTimeout(() => {
        if (contractId) {
          navigate(`/dashboard/contracts/${contractId}`);
        } else {
          navigate('/dashboard/contracts');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmed, contractId, navigate]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          {confirmMutation.isPending ? (
            <>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Confirming Payment...
              </Typography>
              <Typography color="text.secondary">
                Please wait while we confirm your payment.
              </Typography>
            </>
          ) : (
            <>
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
                Your payment has been processed successfully. The funds are now held in escrow
                and will be released to the freelancer upon completion.
              </Typography>

              {paymentIntentId && (
                <Alert severity="success" sx={{ my: 3, textAlign: 'left' }}>
                  <Typography variant="body2">
                    <strong>Status:</strong> Payment confirmed and held in escrow
                  </Typography>
                </Alert>
              )}

              <Typography variant="body2" color="text.secondary" paragraph>
                Redirecting to contract details...
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={() => contractId 
                    ? navigate(`/dashboard/contracts/${contractId}`) 
                    : navigate('/dashboard/contracts')
                  }
                >
                  View Contract
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentSuccessPage;
