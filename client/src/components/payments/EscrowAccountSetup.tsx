import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid,
} from '@mui/material';
import {
  AccountBalance,
  Security,
  Verified,
  Warning,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiService } from '@/services/api';

interface EscrowAccountSetupProps {
  userRole: 'client' | 'freelancer';
  onComplete?: () => void;
}

export const EscrowAccountSetup: React.FC<EscrowAccountSetupProps> = ({
  userRole,
  onComplete,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const queryClient = useQueryClient();

  const { data: accountData, isLoading, refetch } = useQuery({
    queryKey: ['escrow-account'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/payments/escrow/account');
        return response.data.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null; // No account exists yet
        }
        throw error;
      }
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: any) => apiService.post('/payments/escrow/account', data),
    onSuccess: (response) => {
      const { onboardingUrl } = response.data.data;
      // Redirect to Stripe onboarding
      window.location.href = onboardingUrl;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create escrow account');
    },
  });

  const steps = [
    'Account Creation',
    'Identity Verification',
    'Bank Account Setup',
    'Account Activation',
  ];

  const handleCreateAccount = () => {
    createAccountMutation.mutate({ accountType: userRole });
  };

  const getAccountStatus = () => {
    if (!accountData?.escrowAccount) {
      return {
        step: 0,
        status: 'not_started',
        message: 'Account not created yet',
      };
    }

    const { escrowAccount, stripeAccount } = accountData;

    if (!stripeAccount.details_submitted) {
      return {
        step: 1,
        status: 'pending',
        message: 'Complete identity verification with Stripe',
      };
    }

    if (!stripeAccount.charges_enabled || !stripeAccount.payouts_enabled) {
      return {
        step: 2,
        status: 'pending',
        message: 'Complete bank account setup',
      };
    }

    if (escrowAccount.status === 'active') {
      return {
        step: 3,
        status: 'completed',
        message: 'Account is active and ready to use',
      };
    }

    return {
      step: 2,
      status: 'pending',
      message: 'Account verification in progress',
    };
  };

  const accountStatus = getAccountStatus();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'pending':
        return <Warning color="warning" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Escrow Account Setup
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Set up your secure escrow account to {userRole === 'client' ? 'make payments' : 'receive payments'} on the platform.
      </Typography>

      {/* Progress Stepper */}
      <Stepper activeStep={accountStatus.step} sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label} completed={index < accountStatus.step}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Current Status */}
      <Alert 
        severity={getStatusColor(accountStatus.status) as any}
        icon={getStatusIcon(accountStatus.status)}
        sx={{ mb: 3 }}
      >
        {accountStatus.message}
      </Alert>

      {/* Account Details */}
      {accountData?.escrowAccount && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Account Type
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {accountData.escrowAccount.accountType}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={accountData.escrowAccount.status.toUpperCase()}
                  color={getStatusColor(accountData.escrowAccount.status) as any}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Verification Status
                </Typography>
                <Chip
                  label={accountData.escrowAccount.verificationStatus.toUpperCase()}
                  color={getStatusColor(accountData.escrowAccount.verificationStatus) as any}
                  size="small"
                />
              </Grid>
              
              {userRole === 'freelancer' && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Available Balance
                  </Typography>
                  <Typography variant="h6">
                    ${accountData.escrowAccount.balance.toFixed(2)} {accountData.escrowAccount.currency}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Setup Steps */}
      {!accountData?.escrowAccount ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Get Started
            </Typography>
            
            <Typography variant="body2" paragraph>
              Create your secure escrow account to start {userRole === 'client' ? 'making' : 'receiving'} payments.
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <Security color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Secure & Encrypted"
                  secondary="Your financial information is protected with bank-level security"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <AccountBalance color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="FDIC Insured"
                  secondary="Funds are held in FDIC-insured accounts for your protection"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Verified color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Verified Platform"
                  secondary="Powered by Stripe, trusted by millions of businesses worldwide"
                />
              </ListItem>
            </List>

            <Button
              variant="contained"
              size="large"
              onClick={handleCreateAccount}
              disabled={createAccountMutation.isPending}
              startIcon={createAccountMutation.isPending ? <CircularProgress size={20} /> : <AccountBalance />}
              sx={{ mt: 2 }}
            >
              {createAccountMutation.isPending ? 'Creating Account...' : 'Create Escrow Account'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Next Steps
            </Typography>
            
            {accountStatus.status === 'completed' ? (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Your escrow account is fully set up and ready to use!
                </Alert>
                
                <Button
                  variant="contained"
                  onClick={onComplete}
                  startIcon={<CheckCircle />}
                >
                  Continue to Dashboard
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" paragraph>
                  Complete your account setup with Stripe to start using the payment system.
                </Typography>
                
                <Button
                  variant="outlined"
                  onClick={() => refetch()}
                  sx={{ mr: 2 }}
                >
                  Check Status
                </Button>
                
                {accountData.stripeAccount && !accountData.stripeAccount.details_submitted && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      // Create new onboarding link
                      createAccountMutation.mutate({ accountType: userRole });
                    }}
                  >
                    Continue Setup
                  </Button>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Paper>
  );
};