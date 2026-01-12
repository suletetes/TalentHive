import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Paper } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Work,
  Star,
  AttachMoney,
  Visibility,
  Schedule,
} from '@mui/icons-material';
import { usersService } from '@/services/api/users.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

interface FreelancerAnalyticsProps {
  userId: string;
}

export const FreelancerAnalytics: React.FC<FreelancerAnalyticsProps> = ({ userId }) => {
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['freelancerStats', userId],
    queryFn: () => usersService.getUserStats(userId),
    enabled: !!userId,
  });

  const { data: viewsData } = useQuery({
    queryKey: ['profileViews', userId],
    queryFn: () => usersService.getProfileViewAnalytics(userId, 30),
    enabled: !!userId,
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load analytics data" />;
  }

  const stats = statsData || {};
  const views = viewsData || {};

  const metrics = [
    {
      icon: Work,
      label: 'Total Projects',
      value: stats.totalProjects || 0,
      color: 'primary.main',
      description: 'All projects worked on',
    },
    {
      icon: TrendingUp,
      label: 'Completion Rate',
      value: `${stats.completionRate || 0}%`,
      color: 'success.main',
      description: 'Successfully completed projects',
    },
    {
      icon: Star,
      label: 'Average Rating',
      value: `${stats.averageRating?.toFixed(1) || 0}/5.0`,
      color: 'warning.main',
      description: `Based on ${stats.totalReviews || 0} reviews`,
    },
    {
      icon: AttachMoney,
      label: 'Total Earnings',
      value: `$${stats.totalEarnings?.toLocaleString() || 0}`,
      color: 'success.main',
      description: 'Lifetime earnings',
    },
    {
      icon: Visibility,
      label: 'Profile Views',
      value: stats.profileViews || 0,
      color: 'info.main',
      description: 'Last 30 days',
    },
    {
      icon: Schedule,
      label: 'Response Time',
      value: stats.responseTime || 'N/A',
      color: 'secondary.main',
      description: 'Average response time',
    },
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
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

      {/* Performance Overview */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Performance Overview
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Completed Projects
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {stats.completedProjects || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Out of {stats.totalProjects || 0} total projects
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active Projects
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {stats.activeProjects || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Currently in progress
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Profile Visibility */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Profile Visibility
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Profile Views
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {stats.profileViews || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Unique Viewers
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {views.uniqueViewers || 0}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Views This Month
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {views.viewsThisMonth || 0}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
