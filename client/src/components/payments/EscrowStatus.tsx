import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface EscrowStatusProps {
  amount: number;
  status: 'held' | 'released' | 'disputed' | 'refunded';
  releaseDate?: string;
  contractId?: string;
  onRelease?: () => Promise<void>;
  onDispute?: () => Promise<void>;
}

export const EscrowStatus: React.FC<EscrowStatusProps> = ({
  amount,
  status,
  releaseDate,
  contractId,
  onRelease,
  onDispute,
}) => {
  const [infoDialogOpen, setInfoDialogOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const getStatusColor = () => {
    switch (status) {
      case 'held':
        return 'warning';
      case 'released':
        return 'success';
      case 'disputed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'held':
        return <LockIcon />;
      case 'released':
        return <LockOpenIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'held':
        return 'Funds are securely held in escrow until project completion';
      case 'released':
        return 'Funds have been released to the freelancer';
      case 'disputed':
        return 'Funds are held pending dispute resolution';
      case 'refunded':
        return 'Funds have been refunded to the client';
      default:
        return 'Unknown status';
    }
  };

  const handleRelease = async () => {
    if (!onRelease) return;
    setIsProcessing(true);
    try {
      await onRelease();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDispute = async () => {
    if (!onDispute) return;
    setIsProcessing(true);
    try {
      await onDispute();
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Escrow Status</Typography>
            <Button
              size="small"
              startIcon={<InfoIcon />}
              onClick={() => setInfoDialogOpen(true)}
            >
              Learn More
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Escrow Amount
                </Typography>
                <Typography variant="h4">{formatCurrency(amount)}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  icon={getStatusIcon()}
                  label={status.toUpperCase()}
                  color={getStatusColor()}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status Details
                </Typography>
                <Typography variant="body2">{getStatusDescription()}</Typography>
              </Box>
            </Grid>

            {releaseDate && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Scheduled Release Date
                  </Typography>
                  <Typography variant="body2">
                    {new Date(releaseDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <LinearProgress
                variant="determinate"
                value={status === 'released' ? 100 : status === 'held' ? 50 : 25}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Grid>

            {status === 'held' && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {onRelease && (
                    <Button
                      variant="contained"
                      onClick={handleRelease}
                      disabled={isProcessing}
                      fullWidth
                    >
                      Release Funds
                    </Button>
                  )}
                  {onDispute && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDispute}
                      disabled={isProcessing}
                      fullWidth
                    >
                      Raise Dispute
                    </Button>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={() => setInfoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>How Escrow Works</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                🔒 Funds Held Securely
              </Typography>
              <Typography variant="body2" color="text.secondary">
                When you accept a proposal, the client's payment is held securely in escrow. This protects both parties.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                ✅ Milestone Completion
              </Typography>
              <Typography variant="body2" color="text.secondary">
                As you complete project milestones, funds are released according to the contract terms.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                ⚖️ Dispute Resolution
              </Typography>
              <Typography variant="body2" color="text.secondary">
                If there's a disagreement, our support team helps resolve disputes fairly.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                💰 Full Release
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Once the project is complete and approved, all remaining funds are released to you.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
