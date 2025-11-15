import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { Work, Person, Payment, Star } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.role],
    queryFn: async () => {
      if (user?.role === 'client' || user?.role === 'freelancer') {
        const response = await apiService.get<any>('/projects/my/stats');
        return response.data.data;
      }
      return null;
    },
    enabled: !!user,
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiService.get<any>('/users/profile'),
    enabled: !!user,
  });

  const profile = (profileData as any)?.data?.data?.user;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = statsData || {};

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {profile?.profile?.firstName || 'User'}! Here's an overview of your account.
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Work color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {user?.role === 'client' ? 'My Projects' : 'Active Projects'}
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {stats.totalProjects || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.activeProjects || 0} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Person color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {user?.role === 'client' ? 'Freelancers Hired' : 'Proposals'}
                </Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {user?.role === 'client' 
                  ? (stats.freelancersHired || 0)
                  : (stats.totalProposals || 0)
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.role === 'client' ? 'Total hired' : 'Submitted'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Payment color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {user?.role === 'client' ? 'Total Spent' : 'Earnings'}
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                ${stats.totalEarnings || stats.totalSpent || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Star color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Rating</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {profile?.rating?.average?.toFixed(1) || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile?.rating?.count > 0 
                  ? `Based on ${profile.rating.count} reviews`
                  : 'No reviews yet'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No recent activity to display. Start by creating a project or updating your profile.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Button variant="contained" fullWidth component={Link} to="/dashboard/projects/new">
                  Post New Project
                </Button>
                <Button variant="outlined" fullWidth component={Link} to="/dashboard/profile">
                  Update Profile
                </Button>
                <Button variant="outlined" fullWidth component={Link} to="/dashboard/messages">
                  View Messages
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};