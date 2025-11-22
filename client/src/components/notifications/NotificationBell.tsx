import React, { useState, useEffect } from 'react';
import { IconButton, Badge, Menu, MenuItem, Typography, Box, Divider, Button } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUnreadCount } from '@/hooks/api/useNotifications';
import { socketService } from '@/services/socket';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: unreadCount, refetch } = useUnreadCount();

  const displayUnreadCount = typeof unreadCount === 'number' ? unreadCount : 0;

  useEffect(() => {
    // Listen for new notifications via Socket.io
    const handleNewNotification = () => {
      refetch();
    };

    const handleNotificationRead = () => {
      refetch();
    };

    socketService.on('new_notification', handleNewNotification);
    socketService.on('notification_read', handleNotificationRead);

    return () => {
      socketService.off('new_notification', handleNewNotification);
      socketService.off('notification_read', handleNotificationRead);
    };
  }, [refetch]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewAll = () => {
    handleClose();
    navigate('/dashboard/notifications');
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={displayUnreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {displayUnreadCount > 0 && (
            <Typography variant="caption" color="primary">
              {displayUnreadCount} unread
            </Typography>
          )}
        </Box>
        <Divider />
        <NotificationDropdown onClose={handleClose} />
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button fullWidth onClick={handleViewAll}>
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};
