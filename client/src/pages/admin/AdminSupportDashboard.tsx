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

      {stats && (
        <>
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
                  <Typography variant="h4">{stats.total}</Typography>
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
                  <Typography variant="h4">{stats.open}</Typography>
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
                  <Typography variant="h4">{stats.inProgress}</Typography>
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
                  <Typography variant="h4">{stats.resolved}</Typography>
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
                      {stats.byPriority.urgent}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="warning.main">
                      High
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.byPriority.high}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="info.main">
                      Medium
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.byPriority.medium}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Low
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.byPriority.low}
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
                      {stats.byCategory.technical}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Billing</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.byCategory.billing}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Account</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.byCategory.account}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Project</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.byCategory.project}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Other</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.byCategory.other}
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
                <Typography variant="h4">{formatTime(stats.avgResponseTime)}</Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Avg Resolution Time</Typography>
                </Box>
                <Typography variant="h4">{formatTime(stats.avgResolutionTime)}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          All Tickets
        </Typography>
        <SupportTicketList />
      </Paper>
    </Container>
  );
};
