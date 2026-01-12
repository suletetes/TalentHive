import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  AccountBalance,
  Add,
  Delete,
  Edit,
  AttachMoney,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { apiService } from '@/services/api';

const payoutSchema = yup.object({
  amount: yup.number()
    .required('Amount is required')
    .min(10, 'Minimum payout amount is $10')
    .max(10000, 'Maximum payout amount is $10,000'),
});

export const PayoutManager: React.FC = () => {
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState<string>('');

  const queryClient = useQueryClient();

  const { data: accountData, isLoading } = useQuery({
    queryKey: ['escrow-account'],
    queryFn: async () => {
      const response = await apiService.get('/payments/escrow/account');
      return response.data.data;
    },
  });

  const { data: payoutHistory } = useQuery({
    queryKey: ['payout-history'],
    queryFn: async () => {
      const response = await apiService.get('/payments/history?type=withdrawal&limit=5');
      return response.data.data;
    },
  });

  const requestPayoutMutation = useMutation({
    mutationFn: (data: any) => apiService.post('/payments/payout', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow-account'] });
      queryClient.invalidateQueries({ queryKey: ['payout-history'] });
      toast.success('Payout requested successfully!');
      setPayoutDialogOpen(false);
      formik.resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request payout');
    },
  });

  const formik = useFormik({
    initialValues: {
      amount: '',
    },
    validationSchema: payoutSchema,
    onSubmit: (values) => {
      if (!selectedPayoutMethod) {
        toast.error('Please select a payout method');
        return;
      }

      requestPayoutMutation.mutate({
        amount: parseFloat(values.amount),
        payoutMethodId: selectedPayoutMethod,
      });
    },
  });

  const handlePayoutRequest = () => {
    if (!accountData?.escrowAccount?.payoutMethods?.length) {
      toast.error('Please add a payout method first');
      return;
    }

    setSelectedPayoutMethod(accountData.escrowAccount.payoutMethods[0]._id);
    setPayoutDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!accountData?.escrowAccount) {
    return (
      <Alert severity="warning">
        Please set up your escrow account first to manage payouts.
      </Alert>
    );
  }

  const { escrowAccount } = accountData;
  const availableBalance = escrowAccount.balance || 0;
  const payoutMethods = escrowAccount.payoutMethods || [];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Payout Management
      </Typography>

      {/* Balance Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Available Balance</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                ${availableBalance.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {escrowAccount.currency}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">This Month</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                $0.00
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Pending</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                $0.00
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payouts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payout Methods */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Payout Methods</Typography>
            <Button
              startIcon={<Add />}
              variant="outlined"
              size="small"
            >
              Add Method
            </Button>
          </Box>

          {payoutMethods.length === 0 ? (
            <Alert severity="info">
              No payout methods configured. Add a bank account or debit card to receive payments.
            </Alert>
          ) : (
            <List>
              {payoutMethods.map((method: any) => (
                <ListItem key={method._id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountBalance fontSize="small" />
                        <Typography variant="body1">
                          {method.type === 'bank_account' ? 'Bank Account' : 'Debit Card'}
                        </Typography>
                        {method.isDefault && (
                          <Chip label="Default" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {method.details.bankName && `${method.details.bankName} • `}
                          ****{method.details.last4}
                        </Typography>
                        <Chip
                          label={method.status.toUpperCase()}
                          size="small"
                          color={method.status === 'active' ? 'success' : 'warning'}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton size="small" sx={{ mr: 1 }}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Request Payout */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Request Payout
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Transfer your available balance to your bank account. Payouts typically arrive within 1-2 business days.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body1">
              Available: ${availableBalance.toFixed(2)}
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<AttachMoney />}
              onClick={handlePayoutRequest}
              disabled={availableBalance < 10 || payoutMethods.length === 0}
            >
              Request Payout
            </Button>
          </Box>

          {availableBalance < 10 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Minimum payout amount is $10.00
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Payouts */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Payouts
          </Typography>

          {!payoutHistory?.payments?.length ? (
            <Typography variant="body2" color="text.secondary">
              No payouts yet.
            </Typography>
          ) : (
            <List>
              {payoutHistory.payments.map((payout: any) => (
                <ListItem key={payout._id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1">
                          ${payout.amount.toFixed(2)}
                        </Typography>
                        <Chip
                          label={payout.status.toUpperCase()}
                          size="small"
                          color={payout.status === 'completed' ? 'success' : 'warning'}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(payout.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Payout Request Dialog */}
      <Dialog open={payoutDialogOpen} onClose={() => setPayoutDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Payout</DialogTitle>
        
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Available balance: ${availableBalance.toFixed(2)}
            </Typography>

            <TextField
              fullWidth
              name="amount"
              label="Payout Amount"
              type="number"
              value={formik.values.amount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.amount && Boolean(formik.errors.amount)}
              helperText={formik.touched.amount && formik.errors.amount}
              InputProps={{
                startAdornment: <span>$</span>,
              }}
              sx={{ mb: 3 }}
            />

            <Typography variant="body2" gutterBottom>
              Payout Method:
            </Typography>
            
            {payoutMethods.map((method: any) => (
              <Card
                key={method._id}
                sx={{
                  mb: 1,
                  cursor: 'pointer',
                  border: selectedPayoutMethod === method._id ? 2 : 1,
                  borderColor: selectedPayoutMethod === method._id ? 'primary.main' : 'grey.300',
                }}
                onClick={() => setSelectedPayoutMethod(method._id)}
              >
                <CardContent sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalance fontSize="small" />
                    <Typography variant="body2">
                      {method.details.bankName} ****{method.details.last4}
                    </Typography>
                    {method.isDefault && (
                      <Chip label="Default" size="small" color="primary" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}

            <Divider sx={{ my: 2 }} />

            <Alert severity="info">
              Payouts typically arrive within 1-2 business days. A small processing fee may apply.
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setPayoutDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => formik.handleSubmit()}
            variant="contained"
            disabled={requestPayoutMutation.isPending || !selectedPayoutMethod}
          >
            {requestPayoutMutation.isPending ? 'Processing...' : 'Request Payout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};