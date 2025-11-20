import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { paymentsService, Payment } from '@/services/api/payments.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const PaymentsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');

  // Fetch payment history
  const { data: paymentsData, isLoading: paymentsLoading, error: paymentsError, refetch: refetchPayments } = useQuery({
    queryKey: ['payment-history'],
    queryFn: async () => {
      const response = await paymentsService.getPaymentHistory();
      return response.data;
    },
  });

  // Fetch escrow balance (for freelancers)
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['escrow-balance'],
    queryFn: async () => {
      const response = await paymentsService.getEscrowBalance();
      return response.data;
    },
    enabled: user?.role === 'freelancer',
  });

  // Request payout mutation
  const payoutMutation = useMutation({
    mutationFn: (amount: number) => paymentsService.requestPayout({
      amount,
      bankAccountId: 'default', // In a real app, user would select their bank account
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow-balance'] });
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
      toast.success('Payout request submitted successfully');
      setPayoutDialogOpen(false);
      setPayoutAmount('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request payout');
    },
  });

  const handlePayoutRequest = () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (balanceData && amount > balanceData.balance) {
      toast.error('Insufficient balance');
      return;
    }
    payoutMutation.mutate(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'default';
      default:
        return 'default';
    }
  };

  if (paymentsLoading || (user?.role === 'freelancer' && balanceLoading)) {
    return <LoadingSpinner message="Loading payment information..." />;
  }

  if (paymentsError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={paymentsError} onRetry={refetchPayments} />
      </Container>
    );
  }

  const payments = paymentsData || [];
  const balance = balanceData?.balance || 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Payments
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track all your financial transactions
      </Typography>

      <Grid container spacing={3}>
        {/* Balance Card (Freelancers only) */}
        {user?.role === 'freelancer' && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Balance
                </Typography>
                <Typography variant="h3" color="primary" gutterBottom>
                  ${balance.toFixed(2)}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => setPayoutDialogOpen(true)}
                  disabled={balance <= 0}
                >
                  Request Payout
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Payment Methods Card (Clients only) */}
        {user?.role === 'client' && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Methods
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Manage your payment methods and billing information
                </Typography>
                <Button variant="outlined" fullWidth>
                  Manage Payment Methods
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Escrow Account (Clients only) */}
        {user?.role === 'client' && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Escrow Account
                </Typography>
                <Typography variant="h4" color="primary" gutterBottom>
                  $0.00
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Funds held in escrow for active contracts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Payment History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment History
              </Typography>
              {payments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No payment transactions yet
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Project</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell>
                            {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {user?.role === 'freelancer' ? 'Payment received' : 'Payment sent'}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={user?.role === 'freelancer' ? 'success.main' : 'text.primary'}
                              fontWeight="medium"
                            >
                              {user?.role === 'freelancer' ? '+' : '-'}${payment.amount.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={payment.status.toUpperCase()}
                              color={getStatusColor(payment.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {typeof payment.contract === 'string' ? payment.contract : (payment.contract as any)?.title || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payout Request Dialog */}
      <Dialog
        open={payoutDialogOpen}
        onClose={() => setPayoutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Payout</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Available balance: ${balance.toFixed(2)}
          </Alert>
          <TextField
            label="Payout Amount"
            type="number"
            fullWidth
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            placeholder="0.00"
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
            helperText="Enter the amount you want to withdraw"
          />
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Payouts are typically processed within 2-3 business days. Funds will be transferred to your default bank account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayoutDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handlePayoutRequest}
            color="primary"
            variant="contained"
            disabled={payoutMutation.isPending || !payoutAmount}
          >
            {payoutMutation.isPending ? 'Processing...' : 'Request Payout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
