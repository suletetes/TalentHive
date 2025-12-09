import React from 'react';
import { Card, CardContent, Box, Grid, Typography } from '@mui/material';
import {
  People as PeopleIcon,
  Work as WorkIcon,
  Description as ProposalIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface AdminAnalyticsProps {
  analytics: any;
  userId: string;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ analytics }) => {
  return (
    <Grid container spacing={3}>
      {/* Platform-Wide Stats */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Total Users</Typography>
            </Box>
            <Typography variant="h3" color="primary">
              {analytics.totalUsers || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active platform users
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WorkIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Total Projects</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {analytics.totalProjects || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All projects on platform
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircleIcon sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">Active Contracts</Typography>
            </Box>
            <Typography variant="h3" color="info.main">
              {analytics.activeContracts || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Currently in progress
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ProposalIcon sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">Total Proposals</Typography>
            </Box>
            <Typography variant="h3" color="warning.main">
              {analytics.totalProposals || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submitted by freelancers
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MoneyIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Platform Revenue</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              ${analytics.platformRevenue || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total transactions
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6">Growth Rate</Typography>
            </Box>
            <Typography variant="h3" color="secondary.main">
              {analytics.growthRate || 0}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last 30 days
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Admin Activity Summary */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Platform Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Key metrics and platform health indicators
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="h4" color="primary">
                    {analytics.newUsersThisMonth || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New Users (30d)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="h4" color="success.main">
                    {analytics.completedProjects || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Projects
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="h4" color="warning.main">
                    {analytics.pendingDisputes || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Disputes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="h4" color="info.main">
                    {analytics.averageRating || '0.0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Platform Avg Rating
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
