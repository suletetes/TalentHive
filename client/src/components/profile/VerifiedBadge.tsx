import React from 'react';
import { Box, Tooltip, Chip } from '@mui/material';
import { Verified as VerifiedIcon } from '@mui/icons-material';

interface VerifiedBadgeProps {
  isVerified: boolean;
  verificationType?: 'email' | 'phone' | 'identity' | 'all';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified,
  verificationType = 'all',
  size = 'medium',
  showLabel = true,
}) => {
  if (!isVerified) {
    return null;
  }

  const getVerificationLabel = () => {
    switch (verificationType) {
      case 'email':
        return 'Email Verified';
      case 'phone':
        return 'Phone Verified';
      case 'identity':
        return 'Identity Verified';
      case 'all':
        return 'Fully Verified';
      default:
        return 'Verified';
    }
  };

  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { fontSize: 16, width: 20, height: 20 };
      case 'large':
        return { fontSize: 24, width: 28, height: 28 };
      default:
        return { fontSize: 20, width: 24, height: 24 };
    }
  };

  const sizeProps = getSizeProps();

  if (showLabel) {
    return (
      <Tooltip title={getVerificationLabel()}>
        <Chip
          icon={<VerifiedIcon sx={{ fontSize: sizeProps.fontSize }} />}
          label={getVerificationLabel()}
          color="primary"
          variant="outlined"
          size={size === 'small' ? 'small' : 'medium'}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={getVerificationLabel()}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: sizeProps.width,
          height: sizeProps.height,
          borderRadius: '50%',
          backgroundColor: 'primary.main',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        <VerifiedIcon sx={{ fontSize: sizeProps.fontSize }} />
      </Box>
    </Tooltip>
  );
};
