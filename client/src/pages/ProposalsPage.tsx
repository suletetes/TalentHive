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
  Divider,
  Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { proposalsService, Proposal } from '@/services/api/proposals.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EditProposalForm } from '@/components/proposals/EditProposalForm';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const ProposalsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch proposals
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-proposals'],
    queryFn: async () => {
      const response = await proposalsService.getMyProposals();
      return response.data;
    },
    enabled: user?.role === 'freelancer',
  });

  // Withdraw proposal mutation
  const withdrawMutation = useMutation({
    mutationFn: (proposalId: string) => proposalsService.withdrawProposal(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
      toast.success('Proposal withdrawn successfully');
      setWithdrawDialogOpen(false);
      setSelectedProposal(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to withdraw proposal');
    },
  });

  // Delete proposal mutation
  const deleteMutation = useMutation({
    mutationFn: (proposalId: string) => proposalsService.deleteProposal(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
      toast.success('Proposal deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedProposal(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete proposal');
    },
  });

  const handleDeleteClick = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedProposal) {
      deleteMutation.mutate(selectedProposal._id);
    }
  };

  const handleViewDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
  };

  const handleWithdrawClick = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setWithdrawDialogOpen(true);
  };

  const handleWithdrawConfirm = () => {
    if (selectedProposal) {
      withdrawMutation.mutate(selectedProposal._id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'withdrawn':
        return 'default';
      default:
        return 'default';
    }
  };

  if (user?.role !== 'freelancer') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          This page is only accessible to freelancers.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading proposals..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={error} onRetry={refetch} />
      </Container>
    );
  }

  const proposals = data || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Proposals
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View and manage all your submitted proposals
      </Typography>

      {proposals.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              You haven't submitted any proposals yet. Browse projects and submit proposals to get started!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {proposals.map((proposal) => (
            <Grid item xs={12} key={proposal._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        Project: {typeof proposal.project === 'string' ? proposal.project : (proposal.project as any).title || 'Unknown Project'}
                      </Typography>
                      <Box display="flex" gap={2} alignItems="center" mb={1}>
                        <Chip
                          label={proposal.status.toUpperCase()}
                          color={getStatusColor(proposal.status)}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          Submitted: {format(new Date(proposal.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="h6" color="primary">
                        ${proposal.proposedBudget?.amount || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {proposal.proposedBudget?.type === 'hourly' ? '/hour' : 'fixed'}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Timeline: {proposal.timeline?.duration || 0} {proposal.timeline?.unit || 'days'}
                  </Typography>

                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewDetails(proposal)}
                    >
                      View Details
                    </Button>
                    {proposal.status === 'submitted' && (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => {
                            setSelectedProposal(proposal);
                            setEditDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleWithdrawClick(proposal)}
                        >
                          Withdraw
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDeleteClick(proposal)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Proposal Details Dialog */}
      <Dialog
        open={!!selectedProposal && !withdrawDialogOpen}
        onClose={() => setSelectedProposal(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedProposal && (
          <>
            <DialogTitle>
              Proposal Details
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Project
                </Typography>
                <Typography variant="body1">
                  {typeof selectedProposal.project === 'string' ? selectedProposal.project : (selectedProposal.project as any).title || 'Unknown Project'}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={selectedProposal.status.toUpperCase()}
                  color={getStatusColor(selectedProposal.status)}
                  size="small"
                />
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Proposed Budget
                </Typography>
                <Typography variant="h6" color="primary">
                  ${selectedProposal.proposedBudget?.amount || 0}
                  {selectedProposal.proposedBudget?.type === 'hourly' ? '/hour' : ' (fixed)'}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Timeline
                </Typography>
                <Typography variant="body1">
                  {selectedProposal.timeline?.duration || 0} {selectedProposal.timeline?.unit || 'days'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cover Letter
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedProposal.coverLetter}
                </Typography>
              </Box>

              {selectedProposal.milestones && selectedProposal.milestones.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Milestones
                  </Typography>
                  {selectedProposal.milestones.map((milestone, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {milestone.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {milestone.description}
                        </Typography>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">
                            Amount: ${milestone.amount}
                          </Typography>
                          <Typography variant="body2">
                            Duration: {milestone.duration} days
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Submitted on {format(new Date(selectedProposal.createdAt), 'MMMM dd, yyyy')}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedProposal(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Withdraw Confirmation Dialog */}
      <Dialog
        open={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Withdraw Proposal</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to withdraw this proposal? The client will be notified and you won't be able to resubmit it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleWithdrawConfirm}
            color="error"
            variant="contained"
            disabled={withdrawMutation.isPending}
          >
            {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Proposal</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to permanently delete this proposal? All associated data will be removed from the system.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Proposal Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedProposal(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Proposal</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedProposal && (
            <EditProposalForm
              proposal={selectedProposal}
              onSuccess={() => {
                setEditDialogOpen(false);
                setSelectedProposal(null);
              }}
              onCancel={() => {
                setEditDialogOpen(false);
                setSelectedProposal(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};
