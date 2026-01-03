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
  Payment as PaymentIcon,
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
import { ReviewModal } from '@/components/reviews/ReviewModal';
import { useReviewPrompt } from '@/hooks/useReviewPrompt';
import { CreateDisputeDialog } from '@/components/disputes/CreateDisputeDialog';
import { format, isValid, parseISO } from 'date-fns';

// Safe date formatter
const formatDate = (dateStr: string | Date | undefined, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(date) ? format(date, formatStr) : 'Invalid date';
  } catch {
    return 'Invalid date';
  }
};

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
  
  // Debug logging
  console.log('[CONTRACT DETAIL] URL param id:', id);
  console.log('[CONTRACT DETAIL] Is valid ObjectId:', id && /^[a-f\d]{24}$/i.test(id));
  
  // Dialog states
  const [submitDialog, setSubmitDialog] = useState<any>(null);
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [submitNotes, setSubmitNotes] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);

  const { data: contractData, isLoading, error, refetch } = useContract(id || '');
  
  // Extract contract from various response structures
  const contract = (contractData as any)?.data?.contract 
    || (contractData as any)?.contract 
    || (contractData as any)?.data 
    || contractData;
  
  // Debug contract data
  console.log('[CONTRACT DETAIL] Raw contractData:', contractData);
  console.log('[CONTRACT DETAIL] Extracted contract:', contract);
  console.log('[CONTRACT DETAIL] Contract title:', contract?.title);
  console.log('[CONTRACT DETAIL] Milestones count:', contract?.milestones?.length);
  console.log('[CONTRACT DETAIL] isLoading:', isLoading);
  console.log('[CONTRACT DETAIL] error:', error);

  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';

  // Review prompt hook (after contract is defined)
  const { showReviewModal, reviewData, promptReview, closeReviewModal } = useReviewPrompt();

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
    mutationFn: async ({ milestoneId, milestoneTitle, notes }: { milestoneId: string; milestoneTitle: string; notes: string }) => {
      console.log('[SUBMIT MILESTONE] Starting submission for milestone:', milestoneId, 'title:', milestoneTitle);
      
      // First, refetch the contract to get fresh milestone IDs
      const freshContractResponse = await contractsService.getContractById(id!);
      const freshContract = freshContractResponse?.data?.contract || freshContractResponse?.contract || freshContractResponse?.data || freshContractResponse;
      
      console.log('[SUBMIT MILESTONE] Fresh contract milestones:', freshContract?.milestones?.map((m: any) => ({ id: m._id, title: m.title })));
      
      // Find the milestone by title (more reliable than ID which can change)
      const freshMilestone = freshContract?.milestones?.find((m: any) => m.title === milestoneTitle);
      
      if (!freshMilestone) {
        throw new Error(`Milestone "${milestoneTitle}" not found in contract. Please refresh the page.`);
      }
      
      const actualMilestoneId = freshMilestone._id;
      console.log('[SUBMIT MILESTONE] Using fresh milestone ID:', actualMilestoneId);
      
      const result = await contractsService.submitMilestone(id!, actualMilestoneId, {
        deliverables: [],
        freelancerNotes: notes,
      });
      return result;
    },
    onSuccess: async () => {
      toast.success('Milestone submitted for review');
      // Invalidate both queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['contract', id] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      await refetch();
      setSubmitDialog(null);
      setSubmitNotes('');
    },
    onError: (err: any) => {
      console.error('[SUBMIT MILESTONE] Error:', err);
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to submit milestone';
      toast.error(errorMessage);
      // Refetch to get fresh data in case of stale milestone IDs
      refetch();
    },
  });

  // Approve milestone mutation
  const approveMutation = useMutation({
    mutationFn: async ({ milestoneId, milestoneTitle, feedback }: { milestoneId: string; milestoneTitle: string; feedback: string }) => {
      console.log('[APPROVE MILESTONE] Starting approval for milestone:', milestoneId, 'title:', milestoneTitle);
      
      // Refetch contract to get fresh milestone IDs
      const freshContractResponse = await contractsService.getContractById(id!);
      const freshContract = freshContractResponse?.data?.contract || freshContractResponse?.contract || freshContractResponse?.data || freshContractResponse;
      const freshMilestone = freshContract?.milestones?.find((m: any) => m.title === milestoneTitle);
      
      if (!freshMilestone) {
        throw new Error(`Milestone "${milestoneTitle}" not found. Please refresh the page.`);
      }
      
      const actualMilestoneId = freshMilestone._id;
      console.log('[APPROVE MILESTONE] Using fresh milestone ID:', actualMilestoneId);
      
      return contractsService.approveMilestone(id!, actualMilestoneId, { clientFeedback: feedback });
    },
    onSuccess: async () => {
      toast.success('Milestone approved!');
      await queryClient.invalidateQueries({ queryKey: ['contract', id] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      await refetch();
      setReviewDialog(null);
      setReviewFeedback('');
    },
    onError: (err: any) => {
      console.error('[APPROVE MILESTONE] Error:', err);
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to approve milestone';
      toast.error(errorMessage);
      refetch();
    },
  });

  // Reject milestone mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ milestoneId, milestoneTitle, feedback }: { milestoneId: string; milestoneTitle: string; feedback: string }) => {
      console.log('[REJECT MILESTONE] Starting rejection for milestone:', milestoneId, 'title:', milestoneTitle);
      
      // Refetch contract to get fresh milestone IDs
      const freshContractResponse = await contractsService.getContractById(id!);
      const freshContract = freshContractResponse?.data?.contract || freshContractResponse?.contract || freshContractResponse?.data || freshContractResponse;
      const freshMilestone = freshContract?.milestones?.find((m: any) => m.title === milestoneTitle);
      
      if (!freshMilestone) {
        throw new Error(`Milestone "${milestoneTitle}" not found. Please refresh the page.`);
      }
      
      const actualMilestoneId = freshMilestone._id;
      console.log('[REJECT MILESTONE] Using fresh milestone ID:', actualMilestoneId);
      
      return contractsService.rejectMilestone(id!, actualMilestoneId, { clientFeedback: feedback });
    },
    onSuccess: async () => {
      toast.success('Milestone rejected');
      await queryClient.invalidateQueries({ queryKey: ['contract', id] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      await refetch();
      setReviewDialog(null);
      setReviewFeedback('');
    },
    onError: (err: any) => {
      console.error('[REJECT MILESTONE] Error:', err);
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to reject milestone';
      toast.error(errorMessage);
      refetch();
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
    return <Container maxWidth="lg" sx={{ py: 4 }}><ErrorState onRetry={refetch} /></Container>;
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Milestones" />
            <Tab label="Details" />
            <Tab label="Terms" />
            {contract.status === 'completed' && <Tab label="Review" />}
          </Tabs>
          {/* Report Issue button - can be implemented later with dispute system */}
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
                        <strong>Due:</strong> {formatDate(milestone.dueDate)}
                      </Typography>
                      {milestone.submittedAt && (
                        <Typography variant="body2" color="info.main">
                          Submitted: {formatDate(milestone.submittedAt)}
                        </Typography>
                      )}
                      {milestone.approvedAt && (
                        <Typography variant="body2" color="success.main">
                          Approved: {formatDate(milestone.approvedAt)}
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
                    
                    {/* Client: Release Payment - Navigate to dedicated page */}
                    {canReleasePayment(milestone) && (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        startIcon={<PaymentIcon />}
                        onClick={() => navigate(`/dashboard/contracts/${id}/release/${milestone._id}`)}
                      >
                        Release ${milestone.amount?.toLocaleString()}
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
              <Typography sx={{ mb: 2 }}>{contract.description}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Timeline</Typography>
              <Typography>Start: {formatDate(contract.startDate, 'MMMM dd, yyyy')}</Typography>
              {contract.endDate && <Typography>End: {formatDate(contract.endDate, 'MMMM dd, yyyy')}</Typography>}
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
            onClick={() => submitMutation.mutate({ milestoneId: submitDialog._id, milestoneTitle: submitDialog.title, notes: submitNotes })}
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
            onClick={() => rejectMutation.mutate({ milestoneId: reviewDialog._id, milestoneTitle: reviewDialog.title, feedback: reviewFeedback })}
            disabled={rejectMutation.isPending}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => approveMutation.mutate({ milestoneId: reviewDialog._id, milestoneTitle: reviewDialog.title, feedback: reviewFeedback })}
            disabled={approveMutation.isPending}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Modal */}
      {reviewData && (
        <ReviewModal
          open={showReviewModal}
          onClose={closeReviewModal}
          contractId={reviewData.contractId}
          revieweeId={reviewData.revieweeId}
          revieweeName={reviewData.revieweeName}
          revieweeRole={reviewData.revieweeRole}
        />
      )}

      {/* Dispute Dialog */}
      <CreateDisputeDialog
        open={disputeDialogOpen}
        onClose={() => setDisputeDialogOpen(false)}
        contractId={contract?._id || ''}
        projectId={contract?.project?._id || (typeof contract?.project === 'object' ? contract?.project?._id : contract?.project) || ''}
      />
    </Container>
  );
};

export default ContractDetailPage;
