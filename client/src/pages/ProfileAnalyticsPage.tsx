import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Paper,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { RootState } from '@/store';
import { usersService } from '@/services/api/users.service';

export const ProfileAnalyticsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['profileAnalytics', user?.id],
    queryFn: () => usersService.getProfileViewAnalytics(user!.id, 30),
    enabled: !!user?.id,
  });

  const { data: viewersData } = useQuery({
    queryKey: ['profileViewers', user?.id],
    queryFn: () => usersService.getProfileViewers(user!.id),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState message="Failed to load analytics data" />
      </Container>
    );
  }

  const analytics = analyticsData?.data || {};
  const viewers = viewersData?.data || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profile Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Track how your profile is performing and who's viewing it
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VisibilityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Views</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {analytics.totalViews || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All-time profile views
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Unique Viewers</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {analytics.uniqueViewers || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Different people who viewed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Avg. Views/Day</Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {analytics.totalViews ? Math.round(analytics.totalViews / 30) : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Viewers */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Profile Viewers
              </Typography>
              {viewers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No viewers yet
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  {viewers.slice(0, 10).map((viewer: any, index: number) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          {viewer.profile?.firstName?.[0] || '?'}
                        </Box>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {viewer.profile?.firstName} {viewer.profile?.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {viewer.role}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(viewer.viewedAt).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
