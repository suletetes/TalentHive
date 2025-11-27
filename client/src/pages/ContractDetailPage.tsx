import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle,
  Cancel,
  Send,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RootState } from '@/store';
import { useContract } from '@/hooks/api/useContracts';
import { contractsService } from '@/services/api/contracts.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/components/ui/ToastProvider';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ py: 3 }}>{children}</Box>}</div>
);

export const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [submitDialog, setSubmitDialog] = useState<any>(null);
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [submitNotes, setSubmitNotes] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');

  const { data: contract, isLoading, error, refetch } = useContract(id || '');

  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';

  // Check if contract is fully signed
  const isFullySigned = () => {
    if (!contract) return false;
    const signatures = contract.signatures || [];
    const clientId = typeof contract.client === 'string' ? contract.client : contract.client?._id;
    const freelancerId = typeof contract.freelancer === 'string' ? contract.freelancer : contract.freelancer?._id;
    const clientSigned = signatures.some((s: any) => s.signedBy === clientId || s.signedBy?._id === clientId);
    const freelancerSigned = signatures.some((s: any) => s.signedBy === freelancerId || s.signedBy?._id === freelancerId);
    return clientSigned && freelancerSigned;
  };

  // Submit milestone mutation
  const submitMutation = useMutation({
    mutationFn: async ({ milestoneId, notes }: { milestoneId: string; notes: string }) => {
      return contractsService.submitMilestone(id!, milestoneId, {
        deliverables: [],
        freelancerNotes: notes,
      });
    },
    onSuccess: () => {
      toast.success('Milestone submitted for review');
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      setSubmitDialog(null);
      setSubmitNotes('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit milestone');
    },
  });

  // Approve milestone mutation
  const approveMutation = useMutation({
    mutationFn: async ({ milestoneId, feedback }: { milestoneId: string; feedback: string }) => {
      return contractsService.approveMilestone(id!, milestoneId, { clientFeedback: feedback });
    },
    onSuccess: () => {
      toast.success('Milestone approved!');
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      setReviewDialog(null);
      setReviewFeedback('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to approve milestone');
    },
  });

  // Reject milestone mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ milestoneId, feedback }: { milestoneId: string; feedback: string }) => {
      return contractsService.rejectMilestone(id!, milestoneId, { clientFeedback: feedback });
    },
    onSuccess: () => {
      toast.success('Milestone rejected');
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      setReviewDialog(null);
      setReviewFeedback('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reject milestone');
    },
  });

  // Release payment mutation
  const releasePaymentMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      return contractsService.releasePayment(id!, milestoneId);
    },
    onSuccess: () => {
      toast.success('Payment released successfully!');
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to release payment');
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      active: 'success', completed: 'info', cancelled: 'error',
      disputed: 'warning', draft: 'default', pending: 'default',
      approved: 'success', paid: 'success', submitted: 'warning',
      in_progress: 'info', rejected: 'error',
    };
    return colors[status] || 'default';
  };

  const canSubmitMilestone = (milestone: any) => {
    return isFreelancer && ['pending', 'in_progress', 'rejected'].includes(milestone.status) && isFullySigned();
  };

  const canReleasePayment = (milestone: any) => {
    return isClient && milestone.status === 'approved';
  };

  const canReviewMilestone = (milestone: any) => {
    return isClient && milestone.status === 'submitted';
  };

  if (isLoading) return <LoadingSpinner message="Loading contract..." />;
  if (error || !contract) {
    return <Container maxWidth="lg" sx={{ py: 4 }}><ErrorState error={error} onRetry={refetch} /></Container>;
  }

  const completedMilestones = contract.milestones?.filter((m: any) => ['approved', 'paid'].includes(m.status)).length || 0;
  const progress = contract.milestones?.length ? (completedMilestones / contract.milestones.length) * 100 : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard/contracts')} sx={{ mb: 2 }}>
        Back to Contracts
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>{contract.title}</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip label={contract.status.toUpperCase()} color={getStatusColor(contract.status)} />
            {!isFullySigned() && <Chip label="AWAITING SIGNATURES" color="warning" size="small" />}
          </Box>
        </Box>
        <Typography variant="h5" color="primary">${contract.totalAmount?.toLocaleString()}</Typography>
      </Box>

      {/* Alert for unsigned contract */}
      {!isFullySigned() && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This contract requires signatures from both parties before work can begin.
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card><CardContent>
            <Typography color="text.secondary" gutterBottom>Client</Typography>
            <Typography variant="h6">{contract.client?.profile?.firstName} {contract.client?.profile?.lastName}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card><CardContent>
            <Typography color="text.secondary" gutterBottom>Freelancer</Typography>
            <Typography variant="h6">{contract.freelancer?.profile?.firstName} {contract.freelancer?.profile?.lastName}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card><CardContent>
            <Typography color="text.secondary" gutterBottom>Progress</Typography>
            <Typography variant="h6">{Math.round(progress)}%</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card><CardContent>
            <Typography color="text.secondary" gutterBottom>Milestones</Typography>
            <Typography variant="h6">{completedMilestones}/{contract.milestones?.length || 0}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Milestones" />
            <Tab label="Details" />
            <Tab label="Terms" />
            {contract.status === 'completed' && <Tab label="Review" />}
          </Tabs>
        </Box>

        {/* Milestones Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {completedMilestones} of {contract.milestones?.length || 0} milestones completed
            </Typography>
          </Box>

          {contract.milestones?.map((milestone: any, idx: number) => (
            <Card key={milestone._id || idx} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="h6">{milestone.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                      {milestone.description}
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Typography variant="body2">
                        <strong>Amount:</strong> ${milestone.amount?.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Due:</strong> {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                      </Typography>
                      {milestone.submittedAt && (
                        <Typography variant="body2" color="info.main">
                          Submitted: {format(new Date(milestone.submittedAt), 'MMM dd, yyyy')}
                        </Typography>
                      )}
                      {milestone.approvedAt && (
                        <Typography variant="body2" color="success.main">
                          Approved: {format(new Date(milestone.approvedAt), 'MMM dd, yyyy')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                    <Chip label={milestone.status.toUpperCase()} color={getStatusColor(milestone.status)} />
                    
                    {/* Freelancer: Submit button */}
                    {canSubmitMilestone(milestone) && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Send />}
                        onClick={() => setSubmitDialog(milestone)}
                      >
                        Submit for Review
                      </Button>
                    )}
                    
                    {/* Client: Review buttons */}
                    {canReviewMilestone(milestone) && (
                      <Button
                        variant="contained"
                        size="small"
                        color="success"
                        onClick={() => setReviewDialog(milestone)}
                      >
                        Review Submission
                      </Button>
                    )}
                    
                    {/* Client: Release Payment button for approved milestones */}
                    {canReleasePayment(milestone) && (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => {
                          if (confirm(`Release payment of $${milestone.amount} for "${milestone.title}"?`)) {
                            releasePaymentMutation.mutate(milestone._id);
                          }
                        }}
                        disabled={releasePaymentMutation.isPending}
                      >
                        {releasePaymentMutation.isPending ? 'Processing...' : `Release $${milestone.amount}`}
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          {(!contract.milestones || contract.milestones.length === 0) && (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No milestones defined for this contract.
            </Typography>
          )}
        </TabPanel>

        {/* Details Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography paragraph>{contract.description}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Timeline</Typography>
              <Typography>Start: {format(new Date(contract.startDate), 'MMMM dd, yyyy')}</Typography>
              {contract.endDate && <Typography>End: {format(new Date(contract.endDate), 'MMMM dd, yyyy')}</Typography>}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Terms Tab */}
        <TabPanel value={tabValue} index={2}>
          {contract.terms && Object.entries(contract.terms).map(([key, value]) => (
            <Box key={key} mb={2}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1')}
              </Typography>
              <Typography variant="body2" color="text.secondary">{value as string}</Typography>
            </Box>
          ))}
        </TabPanel>

        {/* Review Tab - Only shown when contract is completed */}
        {contract.status === 'completed' && (
          <TabPanel value={tabValue} index={3}>
            <ReviewForm contractId={id!} onSuccess={() => toast.success('Review submitted!')} />
          </TabPanel>
        )}
      </Card>

      {/* Submit Milestone Dialog */}
      <Dialog open={!!submitDialog} onClose={() => setSubmitDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Milestone: {submitDialog?.title}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Once submitted, the client will review your work and approve or request changes.
          </Alert>
          <TextField
            fullWidth
            label="Notes for Client (optional)"
            multiline
            rows={3}
            value={submitNotes}
            onChange={(e) => setSubmitNotes(e.target.value)}
            placeholder="Describe what you've completed..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => submitMutation.mutate({ milestoneId: submitDialog._id, notes: submitNotes })}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Milestone Dialog */}
      <Dialog open={!!reviewDialog} onClose={() => setReviewDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Milestone: {reviewDialog?.title}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Review the freelancer's submission and approve or reject it.
          </Alert>
          {reviewDialog?.freelancerNotes && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2">Freelancer's Notes:</Typography>
              <Typography variant="body2">{reviewDialog.freelancerNotes}</Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="Feedback (optional)"
            multiline
            rows={3}
            value={reviewFeedback}
            onChange={(e) => setReviewFeedback(e.target.value)}
            placeholder="Provide feedback..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(null)}>Cancel</Button>
          <Button
            color="error"
            startIcon={<Cancel />}
            onClick={() => rejectMutation.mutate({ milestoneId: reviewDialog._id, feedback: reviewFeedback })}
            disabled={rejectMutation.isPending}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => approveMutation.mutate({ milestoneId: reviewDialog._id, feedback: reviewFeedback })}
            disabled={approveMutation.isPending}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
