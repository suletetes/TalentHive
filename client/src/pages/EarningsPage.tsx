import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  Schedule,
  CheckCircle,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { paymentsService } from '@/services/api/payments.service';
import { apiCore } from '@/services/api/core';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/ToastProvider';
import { format } from 'date-fns';

export const EarningsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);

  // Fetch earnings data
  const { data: earningsData, isLoading: earningsLoading, refetch } = useQuery({
    queryKey: ['freelancer-earnings'],
    queryFn: async () => {
      const response = await apiCore.get('/payments/earnings');
      return response.data;
    },
    enabled: user?.role === 'freelancer',
  });

  // Fetch transaction history
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['freelancer-transactions'],
    queryFn: async () => {
      const response = await paymentsService.getTransactionHistory({ limit: 10 });
      return response;
    },
    enabled: user?.role === 'freelancer',
  });

  // Check Stripe Connect status
  const { data: stripeStatus, isLoading: stripeLoading } = useQuery({
    queryKey: ['stripe-connect-status'],
    queryFn: async () => {
      const response = await apiCore.get('/payments/stripe-connect/status');
      return response.data;
    },
    enabled: user?.role === 'freelancer',
  });

  // Setup Stripe Connect mutation
  const setupStripeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiCore.post('/payments/stripe-connect/onboard');
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to start Stripe setup');
    },
  });

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiCore.post('/payments/payout/request');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payout requested successfully!');
      queryClient.invalidateQueries({ queryKey: ['freelancer-earnings'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to request payout');
    },
  });

  const earnings = earningsData || {
    pending: 0,
    available: 0,
    totalEarned: 0,
    inEscrow: 0,
  };

  const transactions = transactionsData?.data || [];
  const isStripeConnected = stripeStatus?.isConnected || user?.stripeConnectedAccountId;

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      pending: 'warning',
      processing: 'info',
      held_in_escrow: 'info',
      released: 'success',
      refunded: 'error',
      failed: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  if (user?.role !== 'freelancer') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">This page is only available for freelancers.</Alert>
      </Container>
    );
  }

  if (earningsLoading || stripeLoading) {
    return <LoadingSpinner message="Loading earnings..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>Earnings Dashboard</Typography>
          <Typography color="text.secondary">
            Track your earnings and manage payouts
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            variant="outlined"
          >
            Refresh
          </Button>
          {!isStripeConnected && (
            <Button
              startIcon={<SettingsIcon />}
              onClick={() => setSetupDialogOpen(true)}
              variant="contained"
              color="primary"
            >
              Set Up Payments
            </Button>
          )}
        </Box>
      </Box>

      {/* Stripe Connect Alert */}
      {!isStripeConnected && (
        <Alert severity="warning" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={() => setSetupDialogOpen(true)}>
            Set Up Now
          </Button>
        }>
          Set up your payment account to receive earnings. Connect your bank account via Stripe.
        </Alert>
      )}

      {/* Earnings Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Schedule sx={{ mr: 1 }} />
                <Typography variant="subtitle2">In Escrow</Typography>
              </Box>
              <Typography variant="h4">${earnings.inEscrow?.toLocaleString() || '0'}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Awaiting release
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUp sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Pending</Typography>
              </Box>
              <Typography variant="h4">${earnings.pending?.toLocaleString() || '0'}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Processing
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalance sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Available</Typography>
              </Box>
              <Typography variant="h4">${earnings.available?.toLocaleString() || '0'}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Ready to withdraw
              </Typography>
              {earnings.available > 0 && isStripeConnected && (
                <Button
                  size="small"
                  variant="contained"
                  color="inherit"
                  sx={{ mt: 1 }}
                  onClick={() => requestPayoutMutation.mutate()}
                  disabled={requestPayoutMutation.isPending}
                >
                  Request Payout
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircle sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Total Earned</Typography>
              </Box>
              <Typography variant="h4">${earnings.totalEarned?.toLocaleString() || '0'}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                All time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stripe Account Status */}
      {isStripeConnected && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h6">Payment Account Connected</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your Stripe account is set up and ready to receive payments
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                onClick={() => setupStripeMutation.mutate()}
                disabled={setupStripeMutation.isPending}
              >
                Manage Account
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
          {transactionsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : transactions.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No transactions yet
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Your Earnings</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx: any) => (
                    <TableRow key={tx._id}>
                      <TableCell>
                        {format(new Date(tx.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {tx.contract?.title || tx.description || `Payment for contract ${tx.contract?._id || tx.contract || ''}`}
                      </TableCell>
                      <TableCell>${tx.amount?.toLocaleString()}</TableCell>
                      <TableCell color="success">
                        <Typography color="success.main" fontWeight="bold">
                          ${tx.freelancerAmount?.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.status?.replace(/_/g, ' ').toUpperCase()}
                          color={getStatusColor(tx.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Stripe Setup Dialog */}
      <Dialog open={setupDialogOpen} onClose={() => setSetupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Up Payment Account</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            To receive payments, you need to connect a Stripe account. This allows us to securely transfer your earnings.
          </Alert>
          <Typography variant="body2" paragraph>
            You'll be redirected to Stripe to:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li>Verify your identity</li>
            <li>Add your bank account details</li>
            <li>Set up your payout preferences</li>
          </Box>
          <Typography variant="body2" color="text.secondary">
            This process typically takes 5-10 minutes.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => setupStripeMutation.mutate()}
            disabled={setupStripeMutation.isPending}
            startIcon={setupStripeMutation.isPending ? <CircularProgress size={20} /> : <AccountBalance />}
          >
            {setupStripeMutation.isPending ? 'Redirecting...' : 'Connect with Stripe'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EarningsPage;
