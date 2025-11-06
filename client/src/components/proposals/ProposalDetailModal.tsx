import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Avatar,
  Rating,
  Divider,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Close,
  AttachMoney,
  Schedule,
  ExpandMore,
  Person,
  Work,
  Star,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiService } from '@/services/api';

interface ProposalDetailModalProps {
  open: boolean;
  onClose: () => void;
  proposal: any;
  viewMode: 'freelancer' | 'client';
  onAction?: (action: string) => void;
}

export const ProposalDetailModal: React.FC<ProposalDetailModalProps> = ({
  open,
  onClose,
  proposal,
  viewMode,
  onAction,
}) => {
  const [feedback, setFeedback] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);

  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: (data: { clientFeedback?: string }) => 
      apiService.post(`/proposals/${proposal._id}/accept`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal accepted successfully!');
      onAction?.('accept');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept proposal');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { clientFeedback?: string }) => 
      apiService.post(`/proposals/${proposal._id}/reject`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal rejected');
      onAction?.('reject');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject proposal');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => apiService.delete(`/proposals/${proposal._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal withdrawn successfully');
      onAction?.('withdraw');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to withdraw proposal');
    },
  });

  const handleAction = (action: 'accept' | 'reject') => {
    setActionType(action);
    setShowFeedbackForm(true);
  };

  const handleSubmitAction = () => {
    const data = feedback ? { clientFeedback: feedback } : {};
    
    if (actionType === 'accept') {
      acceptMutation.mutate(data);
    } else if (actionType === 'reject') {
      rejectMutation.mutate(data);
    }
  };

  const handleWithdraw = () => {
    if (window.confirm('Are you sure you want to withdraw this proposal? This action cannot be undone.')) {
      withdrawMutation.mutate();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'primary';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'withdrawn': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const formatTimelineDisplay = () => {
    const { duration, unit } = proposal.timeline;
    return `${duration} ${unit}`;
  };

  if (!proposal) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Proposal Details</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Status and Basic Info */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {viewMode === 'client' ? 'Freelancer Proposal' : proposal.project?.title}
            </Typography>
            <Chip
              label={proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              color={getStatusColor(proposal.status) as any}
            />
          </Box>

          {/* Freelancer Info (Client View) */}
          {viewMode === 'client' && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Avatar
                src={proposal.freelancer.profile.avatar}
                sx={{ width: 64, height: 64, mr: 2 }}
              >
                {proposal.freelancer.profile.firstName[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">
                  {proposal.freelancer.profile.firstName} {proposal.freelancer.profile.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {proposal.freelancer.freelancerProfile.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating value={proposal.freelancer.rating} readOnly size="small" />
                    <Typography variant="body2">
                      ({proposal.freelancer.freelancerProfile.completedProjects} projects)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    ${proposal.freelancer.freelancerProfile.hourlyRate}/hr
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Project Info (Freelancer View) */}
          {viewMode === 'freelancer' && proposal.project && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                {proposal.project.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Client Budget: ${proposal.project.budget.min} - ${proposal.project.budget.max}
                {proposal.project.budget.type === 'hourly' ? '/hr' : ''}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Proposal Details */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AttachMoney />
              <Typography variant="h6">
                ${proposal.bidAmount}
                {proposal.project?.budget.type === 'hourly' ? '/hr' : ''}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Bid Amount
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Schedule />
              <Typography variant="h6">
                {formatTimelineDisplay()}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Estimated Timeline
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Cover Letter */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cover Letter
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {proposal.coverLetter}
          </Typography>
        </Box>

        {/* Milestones */}
        {proposal.milestones && proposal.milestones.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">
                  Project Milestones ({proposal.milestones.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {proposal.milestones.map((milestone: any, index: number) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={milestone.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {milestone.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Chip label={`$${milestone.amount}`} size="small" />
                              {milestone.dueDate && (
                                <Chip 
                                  label={format(new Date(milestone.dueDate), 'MMM dd, yyyy')} 
                                  size="small" 
                                  variant="outlined" 
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Total Milestone Amount: ${proposal.milestones.reduce((sum: number, m: any) => sum + m.amount, 0)}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Timestamps */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Submitted: {proposal.submittedAt ? format(new Date(proposal.submittedAt), 'MMM dd, yyyy \'at\' h:mm a') : 'Not submitted'}
          </Typography>
          {proposal.respondedAt && (
            <Typography variant="body2" color="text.secondary">
              Responded: {format(new Date(proposal.respondedAt), 'MMM dd, yyyy \'at\' h:mm a')}
            </Typography>
          )}
        </Box>

        {/* Client Feedback */}
        {proposal.clientFeedback && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Client Feedback:
            </Typography>
            <Typography variant="body2">
              {proposal.clientFeedback}
            </Typography>
          </Box>
        )}

        {/* Feedback Form */}
        {showFeedbackForm && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom>
              {actionType === 'accept' ? 'Acceptance' : 'Rejection'} Message (Optional):
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={`Provide feedback to the freelancer about your ${actionType} decision...`}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleSubmitAction}
                variant="contained"
                color={actionType === 'accept' ? 'success' : 'error'}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
              >
                {actionType === 'accept' ? 'Accept Proposal' : 'Reject Proposal'}
              </Button>
              <Button
                onClick={() => {
                  setShowFeedbackForm(false);
                  setActionType(null);
                  setFeedback('');
                }}
                variant="outlined"
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {/* Client Actions */}
        {viewMode === 'client' && proposal.status === 'submitted' && !showFeedbackForm && (
          <>
            <Button onClick={() => handleAction('reject')} color="error">
              Reject
            </Button>
            <Button onClick={() => handleAction('accept')} variant="contained" color="success">
              Accept Proposal
            </Button>
          </>
        )}

        {/* Freelancer Actions */}
        {viewMode === 'freelancer' && proposal.status === 'submitted' && (
          <Button onClick={handleWithdraw} color="error">
            Withdraw Proposal
          </Button>
        )}

        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};