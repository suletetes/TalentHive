import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Rating,
  Alert,
  Pagination,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const ProjectProposalsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'accept' | 'reject'; proposalId: string } | null>(null);
  const limit = 10;

  // Fetch project details
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await apiService.get(`/projects/${projectId}`);
      return response.data?.data || response.data || {};
    },
    enabled: !!projectId,
  });

  // Fetch proposals for this project
  const { data: proposalsData, isLoading: proposalsLoading } = useQuery({
    queryKey: ['project-proposals', projectId],
    queryFn: async () => {
      console.log(`[PROJECT PROPOSALS] ========== START FETCH ==========`);
      console.log(`[PROJECT PROPOSALS] Fetching proposals for project: ${projectId}`);
      try {
        const response = await apiService.get(`/proposals/project/${projectId}`);
        console.log(`[PROJECT PROPOSALS] Raw response:`, response);
        console.log(`[PROJECT PROPOSALS] response.data:`, response.data);
        console.log(`[PROJECT PROPOSALS] response.data type:`, typeof response.data);
        console.log(`[PROJECT PROPOSALS] response.data.data:`, response.data?.data);
        console.log(`[PROJECT PROPOSALS] response.data.proposals:`, response.data?.proposals);
        
        // Handle multiple response structures
        let proposals = [];
        if (response.data?.proposals && Array.isArray(response.data.proposals)) {
          proposals = response.data.proposals;
          console.log(`[PROJECT PROPOSALS] ✅ Using response.data.proposals (${proposals.length} items)`);
        } else if (response.data?.data?.proposals && Array.isArray(response.data.data.proposals)) {
          proposals = response.data.data.proposals;
          console.log(`[PROJECT PROPOSALS] ✅ Using response.data.data.proposals (${proposals.length} items)`);
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          proposals = response.data.data;
          console.log(`[PROJECT PROPOSALS] ✅ Using response.data.data (${proposals.length} items)`);
        } else if (Array.isArray(response.data)) {
          proposals = response.data;
          console.log(`[PROJECT PROPOSALS] ✅ Using response.data directly (${proposals.length} items)`);
        } else {
          console.warn(`[PROJECT PROPOSALS] ⚠️ No valid proposals array found in response`);
          proposals = [];
        }
        
        console.log(`[PROJECT PROPOSALS] Final result: Found ${proposals.length} proposals`);
        if (proposals.length > 0) {
          console.log(`[PROJECT PROPOSALS] First proposal:`, proposals[0]);
        }
        console.log(`[PROJECT PROPOSALS] ========== END FETCH ==========`);
        return proposals;
      } catch (error) {
        console.error(`[PROJECT PROPOSALS ERROR] ❌ Error fetching proposals:`, error);
        throw error;
      }
    },
    enabled: !!projectId,
  });

  // Accept proposal mutation
  const acceptMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      return apiService.put(`/proposals/${proposalId}/accept`, {});
    },
    onSuccess: () => {
      toast.success('Proposal accepted! Contract created.');
      queryClient.invalidateQueries({ queryKey: ['project-proposals', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      navigate('/dashboard/contracts');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept proposal');
    },
  });

  // Reject proposal mutation
  const rejectMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      return apiService.put(`/proposals/${proposalId}/reject`, {});
    },
    onSuccess: () => {
      toast.success('Proposal rejected');
      queryClient.invalidateQueries({ queryKey: ['project-proposals', projectId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject proposal');
    },
  });

  const handleViewDetails = (proposal: any) => {
    setSelectedProposal(proposal);
    setDetailsOpen(true);
  };

  const handleAccept = (proposalId: string) => {
    setConfirmAction({ type: 'accept', proposalId });
    setConfirmOpen(true);
  };

  const handleReject = (proposalId: string) => {
    setConfirmAction({ type: 'reject', proposalId });
    setConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'accept') {
      acceptMutation.mutate(confirmAction.proposalId);
    } else {
      rejectMutation.mutate(confirmAction.proposalId);
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  if (projectLoading || proposalsLoading) {
    return <LoadingSpinner />;
  }

  const project = projectData;
  const proposals = proposalsData || [];
  const totalPages = Math.ceil(proposals.length / limit);
  const paginatedProposals = proposals.slice((page - 1) * limit, page * limit);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          ← Back
        </Button>
        <Typography variant="h4" gutterBottom>
          Proposals for: {project?.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} received
        </Typography>
      </Box>

      {proposals.length === 0 ? (
        <Alert severity="info">
          No proposals have been submitted for this project yet.
        </Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedProposals.map((proposal: any) => (
            <Grid item xs={12} key={proposal._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar
                        src={proposal.freelancer?.profile?.avatar}
                        sx={{ width: 60, height: 60 }}
                      >
                        {proposal.freelancer?.profile?.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {proposal.freelancer?.profile?.firstName} {proposal.freelancer?.profile?.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {proposal.freelancer?.freelancerProfile?.title || 'Freelancer'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Rating value={proposal.freelancer?.rating?.average || 0} readOnly size="small" />
                          <Typography variant="caption">
                            ({proposal.freelancer?.rating?.count || 0} reviews)
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Chip
                      label={proposal.status}
                      color={
                        proposal.status === 'accepted' ? 'success' :
                        proposal.status === 'rejected' ? 'error' :
                        'default'
                      }
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Bid Amount
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${proposal.bidAmount}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Timeline
                      </Typography>
                      <Typography variant="h6">
                        {proposal.timeline?.duration} {proposal.timeline?.unit}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Milestones
                      </Typography>
                      <Typography variant="h6">
                        {proposal.milestones?.length || 0}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Cover Letter
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {proposal.coverLetter}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => handleViewDetails(proposal)}
                      fullWidth
                    >
                      View Full Details
                    </Button>
                    {proposal.status === 'submitted' && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleAccept(proposal._id)}
                          disabled={acceptMutation.isPending}
                          fullWidth
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleReject(proposal._id)}
                          disabled={rejectMutation.isPending}
                          fullWidth
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Submitted {format(new Date(proposal.createdAt), 'MMM d, yyyy')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {confirmAction?.type === 'accept' ? 'Accept Proposal' : 'Reject Proposal'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {confirmAction?.type === 'accept'
              ? 'Are you sure you want to accept this proposal? This will create a contract.'
              : 'Are you sure you want to reject this proposal?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmAction?.type === 'accept' ? 'success' : 'error'}
            disabled={acceptMutation.isPending || rejectMutation.isPending}
          >
            {confirmAction?.type === 'accept' ? 'Accept' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Proposal Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Proposal Details
        </DialogTitle>
        <DialogContent>
          {selectedProposal && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Cover Letter
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedProposal.coverLetter}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Milestones
              </Typography>
              {selectedProposal.milestones?.map((milestone: any, index: number) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {milestone.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {milestone.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">
                        Amount: <strong>${milestone.amount}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Due: {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
