import React from 'react';
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  AccountBalance as EscrowIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';

export interface PaymentStatusProps {
  status: 'pending' | 'processing' | 'held_in_escrow' | 'released' | 'paid_out' | 'failed' | 'cancelled';
  amount?: number;
  currency?: string;
  error?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  showDetails?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Payment Pending',
    color: 'default' as const,
    icon: <PendingIcon />,
    description: 'Payment is being prepared',
    progress: 10,
  },
  processing: {
    label: 'Processing Payment',
    color: 'info' as const,
    icon: <PaymentIcon />,
    description: 'Payment is being processed',
    progress: 30,
  },
  held_in_escrow: {
    label: 'Held in Escrow',
    color: 'warning' as const,
    icon: <EscrowIcon />,
    description: 'Payment is securely held in escrow',
    progress: 60,
  },
  released: {
    label: 'Payment Released',
    color: 'success' as const,
    icon: <SuccessIcon />,
    description: 'Payment has been released from escrow',
    progress: 80,
  },
  paid_out: {
    label: 'Payment Complete',
    color: 'success' as const,
    icon: <SuccessIcon />,
    description: 'Payment has been completed successfully',
    progress: 100,
  },
  failed: {
    label: 'Payment Failed',
    color: 'error' as const,
    icon: <ErrorIcon />,
    description: 'Payment could not be processed',
    progress: 0,
  },
  cancelled: {
    label: 'Payment Cancelled',
    color: 'default' as const,
    icon: <ErrorIcon />,
    description: 'Payment was cancelled',
    progress: 0,
  },
};

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  amount,
  currency = 'USD',
  error,
  onRetry,
  onCancel,
  showDetails = true,
}) => {
  const config = statusConfig[status];
  const isFailedState = status === 'failed' || status === 'cancelled';
  const isSuccessState = status === 'paid_out';
  const isProcessingState = status === 'processing' || status === 'pending';

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box color={`${config.color}.main`}>
            {config.icon}
          </Box>
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {config.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {config.description}
            </Typography>
          </Box>
          <Chip
            label={config.label}
            color={config.color}
            size="small"
          />
        </Box>

        {showDetails && amount && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Amount
            </Typography>
            <Typography variant="h6">
              {formatAmount(amount)}
            </Typography>
          </Box>
        )}

        {!isFailedState && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {config.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={config.progress}
              color={config.color === 'default' ? 'primary' : config.color}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        )}

        {isFailedState && (onRetry || onCancel) && (
          <Box display="flex" gap={2} mt={2}>
            {onRetry && (
              <Button
                variant="contained"
                color="primary"
                onClick={onRetry}
                size="small"
              >
                Retry Payment
              </Button>
            )}
            {onCancel && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={onCancel}
                size="small"
              >
                Cancel
              </Button>
            )}
          </Box>
        )}

        {isProcessingState && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Please do not close this page while the payment is being processed.
            </Typography>
          </Alert>
        )}

        {isSuccessState && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Payment completed successfully! The funds have been transferred.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatus;