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
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  AttachMoney,
  Schedule,
  MoreVert,
  Visibility,
  Edit,
  Cancel,
  Assignment,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useState } from 'react';

interface ContractCardProps {
  contract: {
    _id: string;
    title: string;
    totalAmount: number;
    currency: string;
    startDate: string;
    endDate: string;
    status: 'draft' | 'active' | 'completed' | 'cancelled' | 'disputed';
    progress: number;
    totalPaid: number;
    remainingAmount: number;
    client: {
      _id: string;
      profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
      };
    };
    freelancer: {
      _id: string;
      profile: {
        firstName: string;
        lastName: string;
        avatar?: string;
      };
      freelancerProfile: {
        title: string;
      };
      rating: number;
    };
    project: {
      title: string;
    };
    milestones: Array<{
      _id: string;
      title: string;
      status: string;
      dueDate: string;
      amount: number;
    }>;
    nextMilestone?: {
      _id: string;
      title: string;
      dueDate: string;
    };
    overdueMilestones: Array<{
      _id: string;
      title: string;
      dueDate: string;
    }>;
    signatures: Array<{
      signedBy: string;
      signedAt: string;
    }>;
  };
  viewMode: 'client' | 'freelancer';
  onView?: (contractId: string) => void;
  onEdit?: (contractId: string) => void;
  onSign?: (contractId: string) => void;
  onCancel?: (contractId: string) => void;
  onManageMilestones?: (contractId: string) => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  viewMode,
  onView,
  onEdit,
  onSign,
  onCancel,
  onManageMilestones,
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
      case 'draft':
        return 'warning';
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'default';
      case 'disputed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Awaiting Signatures';
      case 'active':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'disputed':
        return 'Disputed';
      default:
        return status;
    }
  };

  const isUserSigned = () => {
    const currentUserId = viewMode === 'client' ? contract.client._id : contract.freelancer._id;
    return contract.signatures.some(sig => sig.signedBy === currentUserId);
  };

  const canSign = () => {
    return contract.status === 'draft' && !isUserSigned();
  };

  const canEdit = () => {
    return contract.status === 'draft' && viewMode === 'client';
  };

  const canCancel = () => {
    return ['draft', 'active'].includes(contract.status);
  };

  const otherParty = viewMode === 'client' ? contract.freelancer : contract.client;

  return (
    <Card sx={{ mb: 2, position: 'relative' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {contract.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Project: {contract.project.title}
            </Typography>
          </Box>
          <Chip
            label={getStatusText(contract.status)}
            color={getStatusColor(contract.status) as any}
            size="small"
          />
        </Box>

        {/* Other Party Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Avatar
            src={otherParty.profile.avatar}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {otherParty.profile.firstName[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2">
              {viewMode === 'client' ? 'Freelancer' : 'Client'}: {otherParty.profile.firstName} {otherParty.profile.lastName}
            </Typography>
            {viewMode === 'client' && (
              <Typography variant="body2" color="text.secondary">
                {contract.freelancer.freelancerProfile.title}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Contract Details */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <AttachMoney fontSize="small" />
              <Typography variant="body2" fontWeight="medium">
                ${contract.totalAmount} {contract.currency}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Total Value
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Schedule fontSize="small" />
              <Typography variant="body2" fontWeight="medium">
                {format(new Date(contract.endDate), 'MMM dd, yyyy')}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Due Date
            </Typography>
          </Grid>
        </Grid>

        {/* Progress */}
        {contract.status === 'active' && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {contract.progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={contract.progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Paid: ${contract.totalPaid}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Remaining: ${contract.remainingAmount}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Milestones Summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Milestones ({contract.milestones.length})
          </Typography>
          
          {contract.nextMilestone && (
            <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1, mb: 1 }}>
              <Typography variant="body2" color="primary.contrastText">
                Next: {contract.nextMilestone.title}
              </Typography>
              <Typography variant="caption" color="primary.contrastText">
                Due: {format(new Date(contract.nextMilestone.dueDate), 'MMM dd, yyyy')}
              </Typography>
            </Box>
          )}

          {contract.overdueMilestones.length > 0 && (
            <Box sx={{ p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
              <Typography variant="body2" color="error.contrastText">
                {contract.overdueMilestones.length} overdue milestone{contract.overdueMilestones.length > 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Signature Status */}
        {contract.status === 'draft' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Signatures ({contract.signatures.length}/2)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`Client ${contract.signatures.some(s => s.signedBy === contract.client._id) ? '✓' : '○'}`}
                size="small"
                color={contract.signatures.some(s => s.signedBy === contract.client._id) ? 'success' : 'default'}
                variant="outlined"
              />
              <Chip
                label={`Freelancer ${contract.signatures.some(s => s.signedBy === contract.freelancer._id) ? '✓' : '○'}`}
                size="small"
                color={contract.signatures.some(s => s.signedBy === contract.freelancer._id) ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>
          </Box>
        )}

        {/* Dates */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Start: {format(new Date(contract.startDate), 'MMM dd, yyyy')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            End: {format(new Date(contract.endDate), 'MMM dd, yyyy')}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          startIcon={<Visibility />}
          onClick={() => onView?.(contract._id)}
          size="small"
        >
          View Details
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {canSign() && (
            <Button
              onClick={() => onSign?.(contract._id)}
              variant="contained"
              size="small"
              color="success"
            >
              Sign Contract
            </Button>
          )}

          {contract.status === 'active' && (
            <Button
              startIcon={<Assignment />}
              onClick={() => onManageMilestones?.(contract._id)}
              variant="outlined"
              size="small"
            >
              Milestones
            </Button>
          )}

          {(canEdit() || canCancel()) && (
            <>
              <IconButton onClick={handleMenuOpen} size="small">
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                {canEdit() && (
                  <MenuItem
                    onClick={() => {
                      onEdit?.(contract._id);
                      handleMenuClose();
                    }}
                  >
                    <Edit sx={{ mr: 1 }} fontSize="small" />
                    Edit Contract
                  </MenuItem>
                )}
                {canCancel() && (
                  <MenuItem
                    onClick={() => {
                      onCancel?.(contract._id);
                      handleMenuClose();
                    }}
                  >
                    <Cancel sx={{ mr: 1 }} fontSize="small" />
                    Cancel Contract
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