import React from 'react';
import { Chip } from '@mui/material';
import { VerifiedUser } from '@mui/icons-material';

interface AdminBadgeProps {
  size?: 'small' | 'medium';
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({ size = 'small' }) => {
  return (
    <Chip
      label="Admin"
      size={size}
      icon={<VerifiedUser />}
      color="secondary"
      sx={{
        borderRadius: 1,
        fontWeight: 600,
        fontSize: '0.75rem',
      }}
    />
  );
};
