import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import {
  Inbox,
  FolderOpen,
  Assignment,
  Message,
  Star,
  Work,
  Description,
} from '@mui/icons-material';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'projects' | 'proposals' | 'contracts' | 'messages' | 'reviews' | 'default';
}

const iconMap = {
  projects: <Work sx={{ fontSize: 64 }} />,
  proposals: <Description sx={{ fontSize: 64 }} />,
  contracts: <Assignment sx={{ fontSize: 64 }} />,
  messages: <Message sx={{ fontSize: 64 }} />,
  reviews: <Star sx={{ fontSize: 64 }} />,
  default: <Inbox sx={{ fontSize: 64 }} />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}) => {
  const displayIcon = icon || iconMap[variant];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 6,
        textAlign: 'center',
        bgcolor: 'grey.50',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          color: 'text.secondary',
          mb: 2,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {displayIcon}
      </Box>
      <Typography variant="h6" gutterBottom fontWeight={600} color="text.primary">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
};
