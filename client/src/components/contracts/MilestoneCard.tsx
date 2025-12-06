import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Milestone } from '@/services/api/contracts.service';
import { useSubmitMilestone, useApproveMilestone, useRejectMilestone } from '@/hooks/api/useContracts';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface MilestoneCardProps {
  milestone: Milestone;
  contractId: string;
  userRole: 'client' | 'freelancer';
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
    case 'paid':
      return 'success';
    case 'rejected':
      return 'error';
    case 'submitted':
      return 'warning';
    case 'in_progress':
      return 'info';
    default:
      return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
    case 'paid':
      return <CheckIcon />;
    case 'rejected':
      return <CancelIcon />;
    default:
      return <PendingIcon />;
  }
};

export const MilestoneCard: React.FC<MilestoneCardProps> = ({ milestone, contractId, userRole }) => {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');

  const submitMilestone = useSubmitMilestone();
  const approveMilestone = useApproveMilestone();
  const rejectMilestone = useRejectMilestone();

  const handleSubmit = async () => {
    try {
      await submitMilestone.mutateAsync({
        contractId,
        milestoneId: milestone._id,
        data: {
          deliverables: [],
          freelancerNotes: notes,
        },
      });
      setSubmitDialogOpen(false);
      setNotes('');
    } catch (error) {
      console.error('Failed to submit milestone:', error);
    }
  };

  const handleApprove = async () => {
    try {
      await approveMilestone.mutateAsync({
        contractId,
        milestoneId: milestone._id,
        data: { clientFeedback: feedback },
      });
      setReviewDialogOpen(false);
      setFeedback('');
    } catch (error) {
      console.error('Failed to approve milestone:', error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectMilestone.mutateAsync({
        contractId,
        milestoneId: milestone._id,
        data: { clientFeedback: feedback },
      });
      setReviewDialogOpen(false);
      setFeedback('');
    } catch (error) {
      console.error('Failed to reject milestone:', error);
    }
  };

  const canSubmit = userRole === 'freelancer' && milestone.status === 'in_progress';
  const canReview = userRole === 'client' && milestone.status === 'submitted';

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {milestone.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {milestone.description}
              </Typography>
            </Box>
            <Chip
              icon={getStatusIcon(milestone.status)}
              label={milestone.status.replace('_', ' ').toUpperCase()}
              color={getStatusColor(milestone.status)}
              size="small"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Amount
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                ${milestone.amount?.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Due Date
              </Typography>
              <Typography variant="body1">
                {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
              </Typography>
            </Box>
          </Box>

          {milestone.freelancerNotes && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Freelancer Notes
              </Typography>
              <Typography variant="body2">{milestone.freelancerNotes}</Typography>
            </Box>
          )}

          {milestone.clientFeedback && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Client Feedback
              </Typography>
              <Typography variant="body2">{milestone.clientFeedback}</Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            {canSubmit && (
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setSubmitDialogOpen(true)}
              >
                Submit Milestone
              </Button>
            )}
            {canReview && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => setReviewDialogOpen(true)}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setReviewDialogOpen(true)}
                >
                  Reject
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Milestone</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitMilestone.isPending}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Milestone</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            color="error"
            disabled={rejectMilestone.isPending || !feedback}
          >
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={approveMilestone.isPending}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
