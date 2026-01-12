import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { AttachMoney, Security, Schedule } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { paymentsService } from '@/services/api/payments.service';
import { formatDollars } from '@/utils/currency';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  contract: {
    _id: string;
    title: string;
    freelancer: {
      profile: {
        firstName: string;
        lastName: string;
      };
    };
  };
  milestone: {
    _id: string;
    title: string;
    description: string;
    amount: number;
    dueDate: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PaymentFormContent: React.FC<PaymentFormProps> = ({
  contract,
  milestone,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const createPaymentMutation = useMutation({
    mutationFn: (data: any) => paymentsService.createPaymentIntent(data),
    onSuccess: async (response) => {
      const { clientSecret: secret } = response.data;
      setClientSecret(secret);

      // Confirm the payment with Stripe
      if (stripe && elements) {
        const cardElement = elements.getElement(CardElement);
        if (cardElement) {
          const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(secret, {
            payment_method: {
              card: cardElement,
            },
          });

          if (confirmError) {
            setError(confirmError.message || 'Payment confirmation failed');
            setProcessing(false);
          } else if (paymentIntent?.status === 'succeeded') {
            // Confirm payment on backend
            try {
              await paymentsService.confirmPayment({
                paymentIntentId: paymentIntent.id,
              });
              queryClient.invalidateQueries({ queryKey: ['contracts'] });
              queryClient.invalidateQueries({ queryKey: ['transactions'] });
              toast.success('Payment completed successfully!');
              onSuccess?.();
            } catch (err: any) {
              setError(err.response?.data?.message || 'Failed to confirm payment');
            }
            setProcessing(false);
          }
        }
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Payment failed');
      setProcessing(false);
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    // Create payment intent
    createPaymentMutation.mutate({
      contractId: contract._id,
      milestoneId: milestone._id,
      amount: milestone.amount,
    });
  };

  const platformFee = milestone.amount * 0.05; // 5% platform fee (default)
  const totalAmount = milestone.amount;

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Complete Payment
      </Typography>

      {/* Payment Summary */}
      <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Summary
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Contract: {contract.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Freelancer: {contract.freelancer.profile.firstName} {contract.freelancer.profile.lastName}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {milestone.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {milestone.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={8}>
              <Typography variant="body2">Milestone Amount:</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" align="right">
                {formatDollars(milestone.amount)}
              </Typography>
            </Grid>
            
            <Grid item xs={8}>
              <Typography variant="body2">Platform Fee (5%):</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" align="right">
                {formatDollars(platformFee)}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Divider />
            </Grid>
            
            <Grid item xs={8}>
              <Typography variant="h6">Total:</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h6" align="right">
                {formatDollars(totalAmount)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" gutterBottom>
          Payment Information
        </Typography>

        <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Security Notice */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Security sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="body2" color="info.contrastText">
            Your payment is secured by Stripe. We never store your card information.
          </Typography>
        </Box>

        {/* Escrow Notice */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Schedule sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="body2" color="warning.contrastText">
            Funds will be held in escrow and released to the freelancer upon your approval.
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button onClick={onCancel} variant="outlined" disabled={processing}>
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!stripe || processing}
            startIcon={processing ? <CircularProgress size={20} /> : <AttachMoney />}
          >
            {processing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};