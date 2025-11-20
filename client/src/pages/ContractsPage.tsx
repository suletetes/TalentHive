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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { contractsService, Contract } from '@/services/api/contracts.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ContractsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);

  // Fetch contracts
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: async () => {
      const response = await contractsService.getMyContracts();
      return response.data;
    },
  });

  // Sign contract mutation
  const signMutation = useMutation({
    mutationFn: (contractId: string) => contractsService.signContract(contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-contracts'] });
      toast.success('Contract signed successfully');
      setSignDialogOpen(false);
      setSelectedContract(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to sign contract');
    },
  });

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
  };

  const handleSignClick = (contract: Contract) => {
    setSelectedContract(contract);
    setSignDialogOpen(true);
  };

  const handleSignConfirm = () => {
    if (selectedContract) {
      signMutation.mutate(selectedContract._id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'in_progress':
        return 'info';
      case 'submitted':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateProgress = (contract: Contract) => {
    if (!contract.milestones || contract.milestones.length === 0) return 0;
    const completed = contract.milestones.filter(m => m.status === 'approved').length;
    return (completed / contract.milestones.length) * 100;
  };

  const needsSignature = (contract: Contract) => {
    if (user?.role === 'client') {
      return !contract.signatures?.client?.signed;
    } else if (user?.role === 'freelancer') {
      return !contract.signatures?.freelancer?.signed;
    }
    return false;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading contracts..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={error} onRetry={refetch} />
      </Container>
    );
  }

  const contracts = data || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Contracts
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View and manage all your contracts
      </Typography>

      {contracts.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              You don't have any contracts yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {contracts.map((contract) => (
            <Grid item xs={12} key={contract._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {contract.title}
                      </Typography>
                      <Box display="flex" gap={2} alignItems="center" mb={1}>
                        <Chip
                          label={contract.status.toUpperCase()}
                          color={getStatusColor(contract.status)}
                          size="small"
                        />
                        {needsSignature(contract) && (
                          <Chip
                            label="NEEDS SIGNATURE"
                            color="warning"
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="h6" color="primary">
                        ${contract.budget?.amount || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {contract.budget?.type === 'hourly' ? '/hour' : 'total'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Milestone Progress
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {contract.milestones?.filter(m => m.status === 'approved').length || 0} / {contract.milestones?.length || 0} completed
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={calculateProgress(contract)}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Started: {format(new Date(contract.startDate), 'MMM dd, yyyy')}
                    {contract.endDate && ` • Ends: ${format(new Date(contract.endDate), 'MMM dd, yyyy')}`}
                  </Typography>

                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewDetails(contract)}
                    >
                      View Details
                    </Button>
                    {needsSignature(contract) && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleSignClick(contract)}
                      >
                        Sign Contract
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Contract Details Dialog */}
      <Dialog
        open={!!selectedContract && !signDialogOpen}
        onClose={() => setSelectedContract(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedContract && (
          <>
            <DialogTitle>
              Contract Details
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Title
                </Typography>
                <Typography variant="body1">
                  {selectedContract.title}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={selectedContract.status.toUpperCase()}
                  color={getStatusColor(selectedContract.status)}
                  size="small"
                />
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedContract.description}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Budget
                </Typography>
                <Typography variant="h6" color="primary">
                  ${selectedContract.budget?.amount || 0}
                  {selectedContract.budget?.type === 'hourly' ? '/hour' : ' (total)'}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Timeline
                </Typography>
                <Typography variant="body1">
                  Start: {format(new Date(selectedContract.startDate), 'MMMM dd, yyyy')}
                </Typography>
                {selectedContract.endDate && (
                  <Typography variant="body1">
                    End: {format(new Date(selectedContract.endDate), 'MMMM dd, yyyy')}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Signatures
                </Typography>
                <Box display="flex" gap={2}>
                  <Chip
                    label={`Client: ${selectedContract.signatures?.client?.signed ? 'Signed' : 'Pending'}`}
                    color={selectedContract.signatures?.client?.signed ? 'success' : 'default'}
                    size="small"
                  />
                  <Chip
                    label={`Freelancer: ${selectedContract.signatures?.freelancer?.signed ? 'Signed' : 'Pending'}`}
                    color={selectedContract.signatures?.freelancer?.signed ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Box>

              {selectedContract.milestones && selectedContract.milestones.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Milestones
                  </Typography>
                  {selectedContract.milestones.map((milestone, index) => (
                    <Card key={milestone._id || index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="subtitle1">
                            {milestone.title}
                          </Typography>
                          <Chip
                            label={milestone.status.toUpperCase()}
                            color={getMilestoneStatusColor(milestone.status)}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {milestone.description}
                        </Typography>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">
                            Amount: ${milestone.amount}
                          </Typography>
                          <Typography variant="body2">
                            Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedContract(null)}>Close</Button>
              {needsSignature(selectedContract) && (
                <Button
                  onClick={() => {
                    setSignDialogOpen(true);
                  }}
                  variant="contained"
                  color="primary"
                >
                  Sign Contract
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Sign Contract Confirmation Dialog */}
      <Dialog
        open={signDialogOpen}
        onClose={() => setSignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sign Contract</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            By signing this contract, you agree to the terms and conditions outlined in the contract details.
          </Alert>
          <Typography>
            Are you sure you want to sign this contract?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSignConfirm}
            color="primary"
            variant="contained"
            disabled={signMutation.isPending}
          >
            {signMutation.isPending ? 'Signing...' : 'Sign Contract'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
