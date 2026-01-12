import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Pagination,
} from '@mui/material';
import { DoneAll as DoneAllIcon } from '@mui/icons-material';
import { useNotifications, useMarkAllAsRead } from '@/hooks/api/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';

export const NotificationsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useNotifications({
    page,
    limit: 20,
    isRead: filter === 'unread' ? false : undefined,
    type: typeFilter,
  });

  const markAllAsRead = useMarkAllAsRead();

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleFilterChange = (_event: React.SyntheticEvent, newValue: string) => {
    setFilter(newValue as 'all' | 'unread');
    setPage(1);
  };

  const handleTypeFilterChange = (_event: React.SyntheticEvent, newValue: string) => {
    setTypeFilter(newValue === 'all' ? undefined : newValue);
    setPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const notifications = data?.data || [];
  const pagination = data?.pagination;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Notifications</Typography>
          <Button
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            Mark All as Read
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <Tabs value={filter} onChange={handleFilterChange} sx={{ mb: 2 }}>
            <Tab label="All" value="all" />
            <Tab label="Unread" value="unread" />
          </Tabs>

          <Tabs value={typeFilter || 'all'} onChange={handleTypeFilterChange}>
            <Tab label="All Types" value="all" />
            <Tab label="Messages" value="message" />
            <Tab label="Proposals" value="proposal" />
            <Tab label="Contracts" value="contract" />
            <Tab label="Payments" value="payment" />
            <Tab label="Reviews" value="review" />
            <Tab label="System" value="system" />
          </Tabs>
        </Box>

        {/* Notifications List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No notifications found
            </Typography>
          </Box>
        ) : (
          <>
            <Box>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onClose={() => {}}
                />
              ))}
            </Box>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={pagination.pages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage;
