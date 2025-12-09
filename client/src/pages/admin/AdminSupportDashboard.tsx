import React, { useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import {
  ConfirmationNumber,
  HourglassEmpty,
  CheckCircle,
  Cancel,
  TrendingUp,
  Speed,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTicketStats } from '@/store/slices/supportTicketSlice';
import { RootState, AppDispatch } from '@/store';
import { SupportTicketList } from '@/components/support/SupportTicketList';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

export const AdminSupportDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, loading, error } = useSelector((state: RootState) => state.supportTicket);

  useEffect(() => {
    dispatch(fetchTicketStats());
  }, [dispatch]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Default stats values
  const defaultStats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
    byCategory: { technical: 0, billing: 0, account: 0, project: 0, other: 0 },
    avgResponseTime: 0,
    avgResolutionTime: 0,
  };

  const displayStats = stats || defaultStats;

  if (loading && !stats) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LoadingSpinner />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState message={error} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Support Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Manage and monitor support tickets
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ConfirmationNumber sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" color="text.secondary">
                  Total
                </Typography>
              </Box>
              <Typography variant="h4">{displayStats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HourglassEmpty sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6" color="text.secondary">
                  Open
                </Typography>
              </Box>
              <Typography variant="h4">{displayStats.open}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6" color="text.secondary">
                  In Progress
                </Typography>
              </Box>
              <Typography variant="h4">{displayStats.inProgress}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" color="text.secondary">
                  Resolved
                </Typography>
              </Box>
              <Typography variant="h4">{displayStats.resolved}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              By Priority
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="error.main">
                  Urgent
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {displayStats.byPriority?.urgent || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="warning.main">
                  High
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {displayStats.byPriority?.high || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="info.main">
                  Medium
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {displayStats.byPriority?.medium || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Low
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {displayStats.byPriority?.low || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              By Category
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Technical</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {displayStats.byCategory?.technical || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Billing</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {displayStats.byCategory?.billing || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Account</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {displayStats.byCategory?.account || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Project</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {displayStats.byCategory?.project || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Other</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {displayStats.byCategory?.other || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Speed sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Avg Response Time</Typography>
            </Box>
            <Typography variant="h4">{formatTime(displayStats.avgResponseTime || 0)}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Avg Resolution Time</Typography>
            </Box>
            <Typography variant="h4">{formatTime(displayStats.avgResolutionTime || 0)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          All Tickets
        </Typography>
        <SupportTicketList />
      </Paper>
    </Container>
  );
};
