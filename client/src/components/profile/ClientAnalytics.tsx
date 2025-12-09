import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Paper, List, ListItem, ListItemText, Avatar } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  Work,
  Star,
  CheckCircle,
  Visibility,
  Person,
} from '@mui/icons-material';
import { usersService } from '@/services/api/users.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

interface ClientAnalyticsProps {
  userId: string;
}

export const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ userId }) => {
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['clientStats', userId],
    queryFn: () => usersService.getUserStats(userId),
    enabled: !!userId,
  });

  const { data: viewersData } = useQuery({
    queryKey: ['profileViewers', userId],
    queryFn: () => usersService.getProfileViewers(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load analytics data" />;
  }

  const analytics = statsData || {};
  const viewers = Array.isArray(viewersData) ? viewersData : [];
  const metrics = [
    {
      icon: Work,
      label: 'Projects Posted',
      value: analytics.totalProjectsPosted || 0,
      color: 'primary.main',
      description: 'Total projects created',
    },
    {
      icon: CheckCircle,
      label: 'Active Contracts',
      value: analytics.activeContracts || 0,
      color: 'success.main',
      description: 'Currently active',
    },
    {
      icon: Star,
      label: 'Reviews Given',
      value: analytics.reviewsGiven || 0,
      color: 'warning.main',
      description: 'Feedback provided',
    },
    {
      icon: Visibility,
      label: 'Profile Views',
      value: analytics.profileViews || 0,
      color: 'info.main',
      description: 'Last 30 days',
    },
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
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

      {/* Project Overview */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Project Overview
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Posted
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {analytics.totalProjectsPosted || 0}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active Contracts
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {analytics.activeContracts || 0}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                  {analytics.completedProjects || 0}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Profile Viewers */}
      {viewers && viewers.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Recent Profile Viewers
            </Typography>
            <List>
              {viewers.slice(0, 5).map((viewer: any, index: number) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <ListItemText
                    primary={viewer.viewerName || 'Anonymous'}
                    secondary={new Date(viewer.viewedAt).toLocaleDateString()}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
