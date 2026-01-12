import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  Rating,
  Divider,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AttachMoney,
  Schedule,
  MoreVert,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useState } from 'react';

interface ProposalCardProps {
  proposal: {
    _id: string;
    coverLetter: string;
    bidAmount: number;
    timeline: {
      duration: number;
      unit: 'days' | 'weeks' | 'months';
    };
    status: 'draft' | 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
    submittedAt?: string;
    respondedAt?: string;
    clientFeedback?: string;
    freelancer: {
      _id: string;
      profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
      };
      rating: number;
      freelancerProfile: {
        title: string;
        hourlyRate: number;
        completedProjects: number;
      };
    };
    project?: {
      title: string;
      budget: {
        type: 'fixed' | 'hourly';
        min: number;
        max: number;
      };
    };
    milestones?: Array<{
      title: string;
      description: string;
      amount: number;
      dueDate: string;
    }>;
  };
  viewMode: 'freelancer' | 'client';
  onEdit?: (proposalId: string) => void;
  onWithdraw?: (proposalId: string) => void;
  onAccept?: (proposalId: string) => void;
  onReject?: (proposalId: string) => void;
  onView?: (proposalId: string) => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  viewMode,
  onEdit,
  onWithdraw,
  onAccept,
  onReject,
  onView,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'primary';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'withdrawn':
        return 'default';
      case 'draft':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Under Review';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'withdrawn':
        return 'Withdrawn';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  const canEdit = viewMode === 'freelancer' && ['draft', 'submitted'].includes(proposal.status);
  const canWithdraw = viewMode === 'freelancer' && proposal.status === 'submitted';
  const canAcceptReject = viewMode === 'client' && proposal.status === 'submitted';

  const formatTimelineDisplay = () => {
    const { duration, unit } = proposal.timeline;
    return `${duration} ${unit}`;
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card sx={{ mb: 2, position: 'relative' }}>
      <CardContent>
        {/* Header with freelancer info (client view) or project info (freelancer view) */}
        {viewMode === 'client' ? (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={proposal.freelancer.profile.avatar}
              sx={{ width: 48, height: 48, mr: 2 }}
            >
              {proposal.freelancer.profile.firstName[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">
                {proposal.freelancer.profile.firstName} {proposal.freelancer.profile.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {proposal.freelancer.freelancerProfile.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Rating value={proposal.freelancer.rating} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  ({proposal.freelancer.freelancerProfile.completedProjects} projects)
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                label={getStatusText(proposal.status)}
                color={getStatusColor(proposal.status) as any}
                size="small"
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                {proposal.project?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Budget: ${proposal.project?.budget.min} - ${proposal.project?.budget.max}
                {proposal.project?.budget.type === 'hourly' ? '/hr' : ''}
              </Typography>
            </Box>
            <Chip
              label={getStatusText(proposal.status)}
              color={getStatusColor(proposal.status) as any}
              size="small"
            />
          </Box>
        )}

        {/* Proposal details */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AttachMoney fontSize="small" />
            <Typography variant="body2">
              ${proposal.bidAmount}
              {proposal.project?.budget.type === 'hourly' ? '/hr' : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule fontSize="small" />
            <Typography variant="body2">
              {formatTimelineDisplay()}
            </Typography>
          </Box>
        </Box>

        {/* Cover letter preview */}
        <Typography variant="body2" sx={{ mb: 2 }}>
          {truncateText(proposal.coverLetter)}
        </Typography>

        {/* Milestones preview */}
        {proposal.milestones && proposal.milestones.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {proposal.milestones.length} milestone{proposal.milestones.length > 1 ? 's' : ''}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {proposal.milestones.slice(0, 3).map((milestone, index) => (
                <Chip
                  key={index}
                  label={`${milestone.title} - $${milestone.amount}`}
                  size="small"
                  variant="outlined"
                />
              ))}
              {proposal.milestones.length > 3 && (
                <Chip
                  label={`+${proposal.milestones.length - 3} more`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        )}

        {/* Timestamps */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          {proposal.submittedAt && (
            <Typography variant="caption" color="text.secondary">
              Submitted: {format(new Date(proposal.submittedAt), 'MMM dd, yyyy')}
            </Typography>
          )}
          {proposal.respondedAt && (
            <Typography variant="caption" color="text.secondary">
              Responded: {format(new Date(proposal.respondedAt), 'MMM dd, yyyy')}
            </Typography>
          )}
        </Box>

        {/* Client feedback */}
        {proposal.clientFeedback && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Client Feedback:
              </Typography>
              <Typography variant="body2">
                {proposal.clientFeedback}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          startIcon={<Visibility />}
          onClick={() => onView?.(proposal._id)}
          size="small"
        >
          View Details
        </Button>

        <Box>
          {viewMode === 'client' && canAcceptReject && (
            <>
              <Button
                onClick={() => onReject?.(proposal._id)}
                size="small"
                sx={{ mr: 1 }}
              >
                Reject
              </Button>
              <Button
                onClick={() => onAccept?.(proposal._id)}
                variant="contained"
                size="small"
              >
                Accept
              </Button>
            </>
          )}

          {viewMode === 'freelancer' && (canEdit || canWithdraw) && (
            <>
              <IconButton onClick={handleMenuOpen} size="small">
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                {canEdit && (
                  <MenuItem
                    onClick={() => {
                      onEdit?.(proposal._id);
                      handleMenuClose();
                    }}
                  >
                    <Edit sx={{ mr: 1 }} fontSize="small" />
                    Edit
                  </MenuItem>
                )}
                {canWithdraw && (
                  <MenuItem
                    onClick={() => {
                      onWithdraw?.(proposal._id);
                      handleMenuClose();
                    }}
                  >
                    <Delete sx={{ mr: 1 }} fontSize="small" />
                    Withdraw
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};