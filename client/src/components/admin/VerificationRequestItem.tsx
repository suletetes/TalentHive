import React, { useState } from 'react';
import {
  ListItem,
  Box,
  Avatar,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem as MuiListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  IconButton,
  Collapse
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationService, PendingVerificationRequest } from '@/services/api/verification.service';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface VerificationRequestItemProps {
  request: PendingVerificationRequest;
  onReviewComplete: () => void;
}

const getBadgeIcon = (type: string) => {
  switch (type) {
    case 'identity':
      return <VerifiedUserIcon color="primary" />;
    case 'skills':
      return <StarIcon color="warning" />;
    case 'trusted':
      return <EmojiEventsIcon color="secondary" />;
    default:
      return null;
  }
};

const getBadgeTitle = (type: string) => {
  switch (type) {
    case 'identity':
      return 'Identity Verified';
    case 'skills':
      return 'Skills Verified';
    case 'trusted':
      return 'Trusted Freelancer';
    default:
      return '';
  }
};

export const VerificationRequestItem: React.FC<VerificationRequestItemProps> = ({
  request,
  onReviewComplete
}) => {
  const [expanded, setExpanded] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  const reviewMutation = useMutation({
    mutationFn: (data: {
      userId: string;
      badgeType: string;
      action: 'approve' | 'reject';
      notes?: string;
      rejectionReason?: string;
    }) => verificationService.reviewVerification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['verificationStats'] });
      toast.success(`Verification ${action}d successfully`);
      setReviewDialogOpen(false);
      setNotes('');
      setRejectionReason('');
      onReviewComplete();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to review verification');
    }
  });

  const handleOpenReview = (reviewAction: 'approve' | 'reject') => {
    setAction(reviewAction);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    reviewMutation.mutate({
      userId: request.freelancer._id,
      badgeType: request.badgeType,
      action,
      notes: notes || undefined,
      rejectionReason: action === 'reject' ? rejectionReason : undefined
    });
  };

  const { freelancer } = request;

  return (
    <>
      <ListItem
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          mb: 2,
          flexDirection: 'column',
          alignItems: 'stretch',
          p: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar
              src={freelancer.profile.avatar}
              alt={freelancer.fullName}
              sx={{ width: 48, height: 48 }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {freelancer.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {freelancer.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                {getBadgeIcon(request.badgeType)}
                <Typography variant="body2" fontWeight={500}>
                  {getBadgeTitle(request.badgeType)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • Requested {format(new Date(request.requestedAt), 'MMM dd, yyyy')}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleOpenReview('approve')}
              disabled={reviewMutation.isPending}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelIcon />}
              onClick={() => handleOpenReview('reject')}
              disabled={reviewMutation.isPending}
            >
              Reject
            </Button>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ pl: 8 }}>
            <Typography variant="subtitle2" gutterBottom>
              Freelancer Details
            </Typography>
            
            {freelancer.profile.bio && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Bio:
                </Typography>
                <Typography variant="body2">{freelancer.profile.bio}</Typography>
              </Box>
            )}

            {freelancer.profile.location && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Location:
                </Typography>
                <Typography variant="body2">{freelancer.profile.location}</Typography>
              </Box>
            )}

            {freelancer.skills && freelancer.skills.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Skills:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {freelancer.skills.map((skill, index) => (
                    <Chip key={index} label={skill} size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {freelancer.portfolio && freelancer.portfolio.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Portfolio Items: {freelancer.portfolio.length}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Rating:
              </Typography>
              <Typography variant="body2">
                {freelancer.rating.average > 0
                  ? `${freelancer.rating.average.toFixed(1)} ⭐ (${freelancer.rating.count} reviews)`
                  : 'No reviews yet'}
              </Typography>
            </Box>

            {!request.requirements.qualifies && request.requirements.missing.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Missing Requirements:
                </Typography>
                <List dense>
                  {request.requirements.missing.map((req, index) => (
                    <MuiListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CancelIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={req} />
                    </MuiListItem>
                  ))}
                </List>
              </Alert>
            )}
          </Box>
        </Collapse>
      </ListItem>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {action === 'approve' ? 'Approve' : 'Reject'} Verification Request
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Freelancer: {freelancer.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Badge Type: {getBadgeTitle(request.badgeType)}
            </Typography>

            <TextField
              fullWidth
              label="Admin Notes (Optional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Add any internal notes about this review..."
            />

            {action === 'reject' && (
              <TextField
                fullWidth
                label="Rejection Reason (Required)"
                multiline
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                sx={{ mt: 2 }}
                required
                placeholder="Explain why this verification is being rejected..."
                error={action === 'reject' && !rejectionReason}
                helperText={
                  action === 'reject' && !rejectionReason
                    ? 'Rejection reason is required'
                    : 'This will be sent to the freelancer'
                }
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            color={action === 'approve' ? 'success' : 'error'}
            variant="contained"
            disabled={
              reviewMutation.isPending ||
              (action === 'reject' && !rejectionReason)
            }
          >
            {reviewMutation.isPending
              ? 'Processing...'
              : action === 'approve'
              ? 'Approve'
              : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
