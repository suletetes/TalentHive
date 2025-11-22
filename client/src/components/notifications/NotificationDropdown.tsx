import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNotifications, useMarkAllAsRead } from '@/hooks/api/useNotifications';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { data, isLoading } = useNotifications({ limit: 10, page: 1 });
  const markAllAsRead = useMarkAllAsRead();

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const notifications = data?.data || [];

  if (notifications.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No notifications yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification._id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </Box>
  );
};
