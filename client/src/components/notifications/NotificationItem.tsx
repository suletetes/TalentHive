import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  Message as MessageIcon,
  Description as ProposalIcon,
  Assignment as ContractIcon,
  Payment as PaymentIcon,
  Star as ReviewIcon,
  Info as SystemIcon,
  Delete as DeleteIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/services/api/notifications.service';
import { useMarkAsRead, useDeleteNotification } from '@/hooks/api/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return <MessageIcon />;
    case 'proposal':
      return <ProposalIcon />;
    case 'contract':
      return <ContractIcon />;
    case 'payment':
      return <PaymentIcon />;
    case 'review':
      return <ReviewIcon />;
    case 'system':
      return <SystemIcon />;
    default:
      return <SystemIcon />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'error.main';
    case 'high':
      return 'warning.main';
    case 'normal':
      return 'info.main';
    case 'low':
      return 'text.secondary';
    default:
      return 'text.secondary';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClose,
}) => {
  const navigate = useNavigate();
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();

  const handleClick = async () => {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification._id);
    }
    onClose();
    navigate(notification.link);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification.mutateAsync(notification._id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <MenuItem
      onClick={handleClick}
      sx={{
        py: 1.5,
        px: 2,
        backgroundColor: notification.isRead ? 'transparent' : alpha('#4F46E5', 0.05),
        '&:hover': {
          backgroundColor: notification.isRead
            ? alpha('#000', 0.04)
            : alpha('#4F46E5', 0.1),
        },
        borderLeft: notification.isRead ? 'none' : '3px solid',
        borderColor: getPriorityColor(notification.priority),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 1.5 }}>
        {/* Icon or Avatar */}
        {notification.metadata?.senderId ? (
          <Avatar
            src={notification.metadata.senderId.profile.avatar}
            alt={`${notification.metadata.senderId.profile.firstName} ${notification.metadata.senderId.profile.lastName}`}
            sx={{ width: 40, height: 40 }}
          >
            {notification.metadata.senderId.profile.firstName[0]}
            {notification.metadata.senderId.profile.lastName[0]}
          </Avatar>
        ) : (
          <Avatar sx={{ width: 40, height: 40, bgcolor: getPriorityColor(notification.priority) }}>
            {getNotificationIcon(notification.type)}
          </Avatar>
        )}

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: notification.isRead ? 400 : 600,
                flex: 1,
              }}
            >
              {notification.title}
            </Typography>
            {!notification.isRead && (
              <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
            )}
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 0.5,
            }}
          >
            {notification.message}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </Typography>
        </Box>

        {/* Delete Button */}
        <IconButton
          size="small"
          onClick={handleDelete}
          sx={{
            opacity: 0.6,
            '&:hover': {
              opacity: 1,
              color: 'error.main',
            },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </MenuItem>
  );
};
