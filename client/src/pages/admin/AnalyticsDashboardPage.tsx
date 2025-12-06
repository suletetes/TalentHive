import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { RevenueChart } from '@/components/analytics/RevenueChart';
import { UserGrowthChart } from '@/components/analytics/UserGrowthChart';
import { ProjectStatsChart } from '@/components/analytics/ProjectStatsChart';
import { PaymentAnalyticsChart } from '@/components/analytics/PaymentAnalyticsChart';
import {
  useRevenueAnalytics,
  useUserGrowthAnalytics,
  useProjectStats,
  usePaymentAnalytics,
  useDashboardOverview,
} from '@/hooks/api/useAnalytics';

export const AnalyticsDashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useDashboardOverview();
  const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useRevenueAnalytics({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    groupBy,
  });
  const { data: userGrowthData, isLoading: userGrowthLoading, refetch: refetchUserGrowth } = useUserGrowthAnalytics({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
    groupBy,
  });
  const { data: projectStats, isLoading: projectStatsLoading, refetch: refetchProjectStats } = useProjectStats({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
  });
  const { data: paymentAnalytics, isLoading: paymentLoading, refetch: refetchPaymentAnalytics } = usePaymentAnalytics({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
  });

  const handleRefresh = () => {
    refetchOverview();
    refetchRevenue();
    refetchUserGrowth();
    refetchProjectStats();
    refetchPaymentAnalytics();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export data');
  };

  const formatCurrency = (value: number) => {
    return `$${(value / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Analytics Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button startIcon={<RefreshIcon />} onClick={handleRefresh} variant="outlined">
            Refresh
          </Button>
          <Button startIcon={<DownloadIcon />} onClick={handleExport} variant="contained">
            Export
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              select
              label="Group By"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
            >
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Overview Cards */}
      {overviewLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : overview ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{overview.users.total}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="success.main">
                  +{overview.users.recent} in last 30 days
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WorkIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{overview.projects.total}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Projects
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="success.main">
                  +{overview.projects.recent} in last 30 days
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{overview.contracts.active}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Contracts
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {overview.contracts.total} total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PaymentIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{formatCurrency(overview.revenue.total)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Platform commission
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}

      {/* Revenue Chart */}
      <Box sx={{ mb: 4 }}>
        <RevenueChart
          data={revenueData?.timeline || []}
          isLoading={revenueLoading}
          title="Revenue Overview"
          type="area"
        />
      </Box>

      {/* User Growth Chart */}
      <Box sx={{ mb: 4 }}>
        <UserGrowthChart
          data={userGrowthData?.timeline || []}
          isLoading={userGrowthLoading}
          title="User Growth"
        />
      </Box>

      {/* Project Stats */}
      <Box sx={{ mb: 4 }}>
        <ProjectStatsChart data={projectStats} isLoading={projectStatsLoading} />
      </Box>

      {/* Payment Analytics */}
      <Box sx={{ mb: 4 }}>
        <PaymentAnalyticsChart data={paymentAnalytics} isLoading={paymentLoading} />
      </Box>
    </Container>
  );
};
