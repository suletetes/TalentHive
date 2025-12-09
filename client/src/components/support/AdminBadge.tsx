import React from 'react';
import { Chip } from '@mui/material';
import { VerifiedUser } from '@mui/icons-material';

export const AdminBadge: React.FC = () => {
  return (
    <Chip
      label="Admin"
      size="small"
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
