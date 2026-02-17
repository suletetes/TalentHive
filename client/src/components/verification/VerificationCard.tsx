import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationService, VerificationBadge } from '@/services/api/verification.service';
import { toast } from 'react-hot-toast';

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

const getBadgeDescription = (type: string) => {
  switch (type) {
    case 'identity':
      return 'Confirms you are a real person with a complete profile';
    case 'skills':
      return 'Verifies your skills through portfolio review';
    case 'trusted':
      return 'Premium badge for top-performing freelancers';
    default:
      return '';
  }
};

interface BadgeItemProps {
  badge: VerificationBadge;
  onRequest: () => void;
  onCancel: () => void;
  isRequesting: boolean;
  isCancelling: boolean;
}

const BadgeItem: React.FC<BadgeItemProps> = ({
  badge,
  onRequest,
  onCancel,
  isRequesting,
  isCancelling
}) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusChip = () => {
    switch (badge.status) {
      case 'approved':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Approved"
            color="success"
            size="small"
          />
        );
      case 'pending':
        return (
          <Chip
            icon={<PendingIcon />}
            label="Pending Review"
            color="warning"
            size="small"
          />
        );
      case 'rejected':
        return (
          <Chip
            icon={<CancelIcon />}
            label="Rejected"
            color="error"
            size="small"
          />
        );
      default:
        return badge.qualifies ? (
          <Chip label="Ready to Request" color="default" size="small" variant="outlined" />
        ) : (
          <Chip label="Requirements Not Met" color="default" size="small" variant="outlined" />
        );
    }
  };

  const canRequest = badge.status === 'not_requested' && badge.qualifies;
  const canCancel = badge.status === 'pending';
  const showRequirements = badge.status === 'not_requested' && !badge.qualifies;

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: badge.status === 'approved' ? 'success.50' : 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Box>{getBadgeIcon(badge.type)}</Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {getBadgeTitle(badge.type)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getBadgeDescription(badge.type)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusChip()}
          
          {canRequest && (
            <Button
              variant="contained"
              size="small"
              onClick={onRequest}
              disabled={isRequesting}
            >
              {isRequesting ? 'Requesting...' : 'Request'}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={onCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}

          {(showRequirements || badge.status === 'rejected') && (
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Expanded Details */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
          {badge.status === 'rejected' && badge.rejectionReason && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                Rejection Reason:
              </Typography>
              <Typography variant="body2">{badge.rejectionReason}</Typography>
            </Alert>
          )}

          {showRequirements && badge.requirements?.missing && (
            <>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Requirements Not Met:
              </Typography>
              <List dense>
                {badge.requirements.missing.map((req, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CancelIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={req} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export const VerificationCard: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['verificationStatus'],
    queryFn: () => verificationService.getVerificationStatus()
  });

  const requestMutation = useMutation({
    mutationFn: (badgeType: 'identity' | 'skills' | 'trusted') =>
      verificationService.requestVerification(badgeType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificationStatus'] });
      toast.success('Verification request submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request verification');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (badgeType: string) =>
      verificationService.cancelVerificationRequest(badgeType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificationStatus'] });
      toast.success('Verification request cancelled');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  });

  if (isLoading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Verification Badges</Typography>
          </Box>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error">Failed to load verification status</Alert>
        </CardContent>
      </Card>
    );
  }

  const badges = data?.data?.badges || [];
  const approvedCount = badges.filter(b => b.status === 'approved').length;
  const totalBadges = 3;
  const progress = (approvedCount / totalBadges) * 100;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          gap: 2,
          minWidth: 0
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              lineHeight: 1.2,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            noWrap
          >
            Verification Badges
          </Typography>
          <Chip
            label={`${approvedCount}/${totalBadges}`}
            color={approvedCount === totalBadges ? 'success' : 'default'}
            size="small"
            sx={{ 
              flexShrink: 0,
              fontWeight: 600,
              minWidth: 'fit-content'
            }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Profile Completion
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 1,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 1
              }
            }} 
          />
        </Box>

        <Alert 
          severity="info" 
          icon={<InfoIcon />} 
          sx={{ 
            mb: 2,
            '& .MuiAlert-message': {
              fontSize: '0.875rem'
            }
          }}
        >
          Verification badges help you stand out to clients and build trust on the platform.
        </Alert>

        <Divider sx={{ my: 2 }} />

        {badges.map(badge => (
          <BadgeItem
            key={badge.type}
            badge={badge}
            onRequest={() => requestMutation.mutate(badge.type as any)}
            onCancel={() => cancelMutation.mutate(badge.type)}
            isRequesting={requestMutation.isPending}
            isCancelling={cancelMutation.isPending}
          />
        ))}
      </CardContent>
    </Card>
  );
};
