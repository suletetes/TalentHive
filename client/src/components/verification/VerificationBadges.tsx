import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { VerificationBadge } from '@/services/api/verification.service';

interface VerificationBadgesProps {
  badges: VerificationBadge[];
  size?: 'small' | 'medium';
}

const getBadgeConfig = (type: string) => {
  switch (type) {
    case 'identity':
      return {
        icon: <VerifiedUserIcon />,
        label: 'Identity Verified',
        color: 'primary' as const,
        tooltip: 'Profile identity has been verified by admin'
      };
    case 'skills':
      return {
        icon: <StarIcon />,
        label: 'Skills Verified',
        color: 'warning' as const,
        tooltip: 'Skills and portfolio have been verified by admin'
      };
    case 'trusted':
      return {
        icon: <EmojiEventsIcon />,
        label: 'Trusted Freelancer',
        color: 'secondary' as const,
        tooltip: 'Top-rated freelancer with proven track record'
      };
    default:
      return null;
  }
};

export const VerificationBadges: React.FC<VerificationBadgesProps> = ({
  badges,
  size = 'small'
}) => {
  const approvedBadges = badges.filter(b => b.status === 'approved');

  if (approvedBadges.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
      {approvedBadges.map(badge => {
        const config = getBadgeConfig(badge.type);
        if (!config) return null;

        return (
          <Tooltip key={badge.type} title={config.tooltip} arrow>
            <Chip
              icon={config.icon}
              label={config.label}
              color={config.color}
              size={size}
              sx={{
                fontWeight: 500,
                '& .MuiChip-icon': {
                  fontSize: size === 'small' ? '16px' : '20px'
                }
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
};
