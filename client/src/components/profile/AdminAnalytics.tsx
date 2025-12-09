import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Paper } from '@mui/material';
import {
  People,
  Work,
  AttachMoney,
  TrendingUp,
  Assessment,
  CheckCircle,
} from '@mui/icons-material';

interface AdminAnalyticsProps {
  analytics: any;
  userId: string;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ analytics }) => {
  const platformMetrics = [
    {
      icon: People,
      label: 'Total Users',
      value: analytics.totalUsers || 0,
      color: 'primary.main',
      description: 'Registered users',
    },
    {
      icon: Work,
      label: 'Total Projects',
      value: analytics.totalProjects || 0,
      color: 'info.main',
      description: 'All projects',
    },
    {
      icon: CheckCircle,
      label: 'Active Contracts',
      value: analytics.activeContracts || 0,
      color: 'success.main',
      description: 'Currently active',
    },
    {
      icon: AttachMoney,
      label: 'Platform Revenue',
      value: `$${analytics.platformRevenue?.toLocaleString() || 0}`,
      color: 'success.main',
      description: 'Total commission earned',
    },
    {
      icon: TrendingUp,
      label: 'Growth Rate',
      value: `${analytics.growthRate || 0}%`,
      color: 'warning.main',
      description: 'Month over month',
    },
    {
      icon: Assessment,
      label: 'Completion Rate',
      value: `${analytics.completionRate || 0}%`,
      color: 'info.main',
      description: 'Project success rate',
    },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Platform Analytics
      </Typography>

      <Grid container spacing={3}>
        {platformMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${metric.color}15`,
                      mr: 2,
                    }}
                  >
                    <metric.icon sx={{ color: metric.color, fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {metric.value}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {metric.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* User Distribution */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            User Distribution
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Freelancers
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {analytics.totalFreelancers || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((analytics.totalFreelancers / analytics.totalUsers) * 100 || 0).toFixed(1)}% of users
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Clients
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {analytics.totalClients || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((analytics.totalClients / analytics.totalUsers) * 100 || 0).toFixed(1)}% of users
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Admins
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {analytics.totalAdmins || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Platform administrators
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Revenue Breakdown
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Transactions
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  ${analytics.totalTransactions?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All platform transactions
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Platform Commission
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                  ${analytics.platformRevenue?.toLocaleString() || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {((analytics.platformRevenue / analytics.totalTransactions) * 100 || 0).toFixed(1)}% commission rate
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
