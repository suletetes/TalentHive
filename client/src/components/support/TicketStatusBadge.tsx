import React from 'react';
import { Chip } from '@mui/material';
import {
  HourglassEmpty,
  PlayArrow,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

interface TicketStatusBadgeProps {
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  size?: 'small' | 'medium';
}

export const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({ status, size = 'small' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'open':
        return {
          label: 'Open',
          color: 'info' as const,
          icon: <HourglassEmpty />,
        };
      case 'in-progress':
        return {
          label: 'In Progress',
          color: 'warning' as const,
          icon: <PlayArrow />,
        };
      case 'resolved':
        return {
          label: 'Resolved',
          color: 'success' as const,
          icon: <CheckCircle />,
        };
      case 'closed':
        return {
          label: 'Closed',
          color: 'default' as const,
          icon: <Cancel />,
        };
      default:
        return {
          label: status,
          color: 'default' as const,
          icon: null,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      icon={config.icon || undefined}
      sx={{ borderRadius: 1.5 }}
    />
  );
};
