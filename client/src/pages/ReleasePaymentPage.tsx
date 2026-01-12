import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  AccountBalance,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { RootState } from '@/store';
import { useToast } from '@/components/ui/ToastProvider';
import { contractsService } from '@/services/api/contracts.service';
import { paymentsService } from '@/services/api/payments.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { format } from 'date-fns';

// Initialize Stripe with error handling
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('[STRIPE] Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key).catch((err) => {
      console.error('[STRIPE] Failed to load Stripe.js:', err);
      return null;
    });
  }
  return stripePromise;
};

interface PaymentFormProps {
  clientSecret: string;
  transactionId: string;
  contractId: string;
  amount: number;
  freelancerAmount: number;
  commission: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  transactionId,
  contractId,
  amount,
  freelancerAmount,
  commission,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Stripe is not loaded. Please check your internet connection.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?transaction=${transactionId}&contract=${contractId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('[PAYMENT] Stripe error:', error);
        setErrorMessage(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        await paymentsService.confirmPayment({ paymentIntentId: paymentIntent.id });
        toast.success('Payment successful! Funds are now in escrow.');
        
        await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
        await queryClient.invalidateQueries({ queryKey: ['contracts'] });
        
        navigate(`/dashboard/contracts/${contractId}`, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Payment Summary</Typography>
        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography>Milestone Amount:</Typography>
            <Typography fontWeight="bold">${amount?.toLocaleString()}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography color="text.secondary">Platform Fee:</Typography>
            <Typography color="text.secondary">-${commission?.toLocaleString()}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography>Freelancer Receives:</Typography>
            <Typography fontWeight="bold" color="success.main">
              ${freelancerAmount?.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Box>

      <PaymentElement />

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || isProcessing}
          startIcon={isProcessing ? <CircularProgress size={20} /> : <PaymentIcon />}
          fullWidth
        >
          {isProcessing ? 'Processing...' : `Pay $${amount?.toLocaleString()}`}
        </Button>
      </Box>
    </form>
  );
};


export const ReleasePaymentPage: React.FC = () => {
  const { contractId, milestoneId } = useParams<{ contractId: string; milestoneId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);

  // Get current user from Redux store
  const { user } = useSelector((state: RootState) => state.auth);
  const isClient = user?.role === 'client';

  // Check Stripe availability
  useEffect(() => {
    getStripe().then((stripe) => {
      if (stripe) {
        setStripeLoaded(true);
      } else {
        setStripeError('Failed to load Stripe. Please check your internet connection.');
        console.error('[STRIPE] Failed to load');
      }
    });
  }, []);

  // Fetch contract details
  const { data: contractData, isLoading: contractLoading, error: contractError } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => contractsService.getContractById(contractId!),
    enabled: !!contractId,
  });
  
  // Extract contract from response - handle multiple response formats
  const contract = (contractData as any)?.data?.contract 
    || (contractData as any)?.data 
    || (contractData as any)?.contract 
    || contractData;

  const milestone = contract?.milestones?.find((m: any) => m._id === milestoneId);
  console.log('[RELEASE PAGE] Extracted contract:', contract);
  console.log('[RELEASE PAGE] Contract:', contract?.title);
  console.log('[RELEASE PAGE] Milestone:', milestone?.title, 'Amount:', milestone?.amount, 'Status:', milestone?.status);

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      console.log('[PAYMENT] Creating payment intent...');
      const amount = milestone?.amount;
      if (!amount || amount < 0.5) {
        throw new Error(`Milestone amount ($${amount}) must be at least $0.50`);
      }
      console.log('[PAYMENT] Amount:', amount);
      const response = await paymentsService.createPaymentIntent({
        contractId: contractId!,
        milestoneId: milestoneId!,
        amount,
      });
      console.log('[PAYMENT] Response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('[PAYMENT] Success:', data);
      setClientSecret(data.data.clientSecret);
      setPaymentData(data.data);
    },
    onError: (err: any) => {
      console.error('[PAYMENT] Error:', err);
      toast.error(err.message || 'Failed to initialize payment');
    },
  });

  // Only trigger payment intent creation when conditions are met
  const [hasAttempted, setHasAttempted] = useState(false);
  
  useEffect(() => {
    const canCreatePayment = 
      isClient && 
      milestone && 
      milestone.status === 'approved' && 
      milestone.amount >= 0.5 && 
      !clientSecret && 
      !createPaymentMutation.isPending &&
      !hasAttempted;
    
    console.log('[RELEASE PAGE] Can create payment:', canCreatePayment, {
      isClient,
      milestoneExists: !!milestone,
      status: milestone?.status,
      amount: milestone?.amount,
      hasClientSecret: !!clientSecret,
      isPending: createPaymentMutation.isPending,
      hasAttempted,
    });
    
    if (canCreatePayment) {
      setHasAttempted(true);
      createPaymentMutation.mutate();
    }
  }, [isClient, milestone, clientSecret, createPaymentMutation.isPending, hasAttempted]);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
    queryClient.invalidateQueries({ queryKey: ['contracts'] });
    // Navigate to success page which will confirm the payment and update milestone
    navigate(`/payment-success?contract=${contractId}`);
  };

  const handleCancel = () => {
    navigate(`/dashboard/contracts/${contractId}`);
  };

  if (contractLoading) {
    return <LoadingSpinner message="Loading contract details..." />;
  }

  // Only clients can release payments
  if (!isClient) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" icon={<WarningIcon />}>
          <Typography variant="subtitle1" fontWeight="bold">Access Denied</Typography>
          <Typography variant="body2">
            Only clients can release payments. You are logged in as: <strong>{user?.role || 'unknown'}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please log in with the client account that owns this contract.
          </Typography>
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (contractError || !contract) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ErrorState onRetry={() => window.location.reload()} />
      </Container>
    );
  }

  if (!milestone) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Milestone not found (ID: {milestoneId})</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (milestone.status !== 'approved') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          This milestone must be approved before payment can be released.
          Current status: <strong>{milestone.status}</strong>
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (milestone.amount < 0.5) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Milestone amount (${milestone.amount}) is below the minimum of $0.50 required by Stripe.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        Back to Contract
      </Button>

      <Typography variant="h4" gutterBottom>
        Release Payment
      </Typography>

      {stripeError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {stripeError} - You can still view the payment details below.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Contract & Milestone Info */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Contract Details</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Contract</Typography>
                <Typography fontWeight="bold">{contract.title}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Freelancer</Typography>
                <Typography>
                  {contract.freelancer?.profile?.firstName} {contract.freelancer?.profile?.lastName}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Milestone</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Title</Typography>
                <Typography fontWeight="bold">{milestone.title}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Description</Typography>
                <Typography variant="body2">{milestone.description}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Due Date</Typography>
                <Typography>{format(new Date(milestone.dueDate), 'MMM dd, yyyy')}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip label={milestone.status.toUpperCase()} color="success" size="small" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Amount</Typography>
                <Typography variant="h5" color="primary">
                  ${milestone.amount?.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mt: 2 }} icon={<AccountBalance />}>
            Funds will be held in escrow until released or the escrow period ends.
          </Alert>
        </Grid>

        {/* Payment Form */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Payment Details</Typography>

              {createPaymentMutation.isPending && (
                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>Initializing payment...</Typography>
                </Box>
              )}



              {clientSecret && paymentData && stripeLoaded && (
                <Elements
                  stripe={getStripe()}
                  options={{
                    clientSecret,
                    appearance: { theme: 'stripe' },
                  }}
                >
                  <CheckoutForm
                    clientSecret={clientSecret}
                    transactionId={paymentData.transaction._id}
                    contractId={contractId!}
                    amount={paymentData.breakdown?.amount || milestone.amount}
                    freelancerAmount={paymentData.breakdown?.freelancerAmount || 0}
                    commission={paymentData.breakdown?.commission || 0}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                  />
                </Elements>
              )}

              {clientSecret && !stripeLoaded && (
                <Alert severity="warning">
                  Stripe is loading... If this persists, check your internet connection.
                </Alert>
              )}

              {!clientSecret && !createPaymentMutation.isPending && (
                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                  {createPaymentMutation.isError ? (
                    <>
                      <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                        {(createPaymentMutation.error as any)?.message || 'Failed to initialize payment'}
                      </Alert>
                      <Button 
                        variant="contained"
                        onClick={() => {
                          setHasAttempted(false);
                          createPaymentMutation.reset();
                          setTimeout(() => createPaymentMutation.mutate(), 100);
                        }}
                      >
                        Retry Payment
                      </Button>
                    </>
                  ) : (
                    <>
                      <Typography sx={{ mb: 2 }}>Ready to initialize payment</Typography>
                      <Button 
                        variant="contained"
                        onClick={() => {
                          setHasAttempted(false);
                          createPaymentMutation.mutate();
                        }}
                      >
                        Initialize Payment
                      </Button>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReleasePaymentPage;
