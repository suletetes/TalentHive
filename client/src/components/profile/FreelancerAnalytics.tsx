import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Grid,
  Typography,
  Paper,
  LinearProgress,
  Pagination,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/api/users.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

interface FreelancerAnalyticsProps {
  userId: string;
}

const VIEWERS_PER_PAGE = 10;

export const FreelancerAnalytics: React.FC<FreelancerAnalyticsProps> = ({ userId }) => {
  const [viewersPage, setViewersPage] = useState(1);
  
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['freelancerAnalytics', userId],
    queryFn: async () => {
      const response = await usersService.getProfileViewAnalytics(userId, 30);
      return response.data || response;
    },
  });

  const { data: viewersData } = useQuery({
    queryKey: ['profileViewers', userId],
    queryFn: async () => {
      const response = await usersService.getProfileViewers(userId);
      return response.data || response;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      const response = await usersService.getUserStats(userId);
      return response.data || response;
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load analytics data" />;
  }

  const analytics = analyticsData || {};
  const viewers = Array.isArray(viewersData) ? viewersData : [];
  // getUserStats returns the stats directly (API service extracts .data)
  const stats = statsData || {};

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Freelancer Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Views */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VisibilityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Profile Views</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {analytics.totalViews || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Unique Viewers */}
        <Grid item xs={12} md={3}>
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
                Different people
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Avg Views/Day */}
        <Grid item xs={12} md={3}>
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
                Daily average
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Rating */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StarIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Rating</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {stats.averageRating?.toFixed(1) || '0.0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.totalProjects || 0} projects
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Completeness */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Completeness
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Overall Progress</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {stats.profileCompleteness || 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.profileCompleteness || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Complete your profile to increase visibility
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Response Rate */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                  <Typography variant="h5">
                    {stats.completionRate || 0}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    On-Time Delivery
                  </Typography>
                  <Typography variant="h5">
                    {stats.onTimeDelivery || 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Viewers */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Profile Viewers ({viewers.length})
              </Typography>
              {viewers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No viewers yet
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    {viewers
                      .slice((viewersPage - 1) * VIEWERS_PER_PAGE, viewersPage * VIEWERS_PER_PAGE)
                      .map((viewer: any, index: number) => (
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
                  {Math.ceil(viewers.length / VIEWERS_PER_PAGE) > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Pagination
                        count={Math.ceil(viewers.length / VIEWERS_PER_PAGE)}
                        page={viewersPage}
                        onChange={(e, value) => setViewersPage(value)}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
