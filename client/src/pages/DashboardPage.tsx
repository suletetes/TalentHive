import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { Work, Person, Payment, Star } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { adminService } from '@/services/api/admin.service';

export const DashboardPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // Fetch stats based on role
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.role],
    queryFn: async () => {
      console.log(`[DASHBOARD] Fetching stats for ${user?.role}, user: ${user?._id}`);
      try {
        if (user?.role === 'admin') {
          const response = await adminService.getDashboardStats();
          console.log(`[DASHBOARD] Admin response:`, response);
          // adminService returns response.data, so check for stats
          const stats = response?.data?.stats || response?.stats || response || {};
          console.log(`[DASHBOARD] Admin stats:`, stats);
          return stats;
        } else if (user?.role === 'client' || user?.role === 'freelancer') {
          // apiService.get returns response.data directly
          const response: any = await apiService.get('/projects/my/stats');
          console.log(`[DASHBOARD] Stats response:`, response);
          
          // Handle response structure - apiService returns response.data
          const stats = response?.data || response || {};
          console.log(`[DASHBOARD] Parsed stats:`, stats);
          return stats;
        }
        return {};
      } catch (error) {
        console.error(`[DASHBOARD ERROR]`, error);
        throw error;
      }
    },
    enabled: !!user,
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiService.get<any>('/users/profile'),
    enabled: !!user && user.role !== 'admin',
  });

  const profile = (profileData as any)?.data?.data?.user;
  const stats = statsData || {};

  // Log stats rendering - MUST be before any conditional returns to avoid hooks error
  React.useEffect(() => {
    if (Object.keys(stats).length > 0) {
      console.log(`[DASHBOARD RENDER] Stats:`, stats);
    }
  }, [stats]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Admin Dashboard
  if (user?.role === 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Platform overview and quick access
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard')}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Person color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Users</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {stats.totalUsers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard')}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Work color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Projects</Typography>
                </Box>
                <Typography variant="h4" color="secondary">
                  {stats.totalProjects || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.activeProjects || 0} active
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard')}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Payment color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Revenue</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  ${stats.totalRevenue?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Platform revenue
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard')}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Star color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Contracts</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {stats.totalContracts || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total contracts
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                  <Button variant="contained" component={Link} to="/admin/dashboard">
                    View Full Dashboard
                  </Button>
                  <Button variant="outlined" component={Link} to="/admin/users">
                    Manage Users
                  </Button>
                  <Button variant="outlined" component={Link} to="/admin/projects">
                    Manage Projects
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Freelancer Dashboard
  if (user?.role === 'freelancer') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Welcome back, {profile?.profile?.firstName || 'User'}! Here's your freelancer overview.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/proposals')}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Person color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Proposals</Typography>
                </Box>
                <Typography variant="h4" color="secondary">
                  {stats.totalProposals ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Submitted
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/contracts')}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Work color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Contracts</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {stats.activeProjects ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ongoing
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/payments')}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Payment color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Earnings</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  ${(stats.totalEarnings ?? 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All time
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/reviews')}>
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
                    ? `${profile.rating.count} reviews`
                    : 'No reviews yet'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/hire-now-requests')}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Work color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Hire Now</Typography>
                </Box>
                <Typography variant="h4" color="info.main">
                  New
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Direct hire requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Projects
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Browse available projects and submit proposals to grow your business.
                  </Typography>
                  <Button variant="contained" component={Link} to="/projects" sx={{ mt: 2 }}>
                    Find Work
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Button variant="outlined" fullWidth component={Link} to="/dashboard/proposals">
                    My Proposals
                  </Button>
                  <Button variant="outlined" fullWidth component={Link} to="/dashboard/profile">
                    Update Profile
                  </Button>
                  <Button variant="outlined" fullWidth component={Link} to="/dashboard/messages">
                    Messages
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Client Dashboard
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {profile?.profile?.firstName || 'User'}! Here's your client overview.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/projects')}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Work color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">My Projects</Typography>
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
                <Typography variant="h6">Proposals</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {stats.receivedProposals || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Received
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/contracts')}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Work color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Contracts</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {stats.ongoingContracts || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ongoing
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/payments')}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Payment color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Spent</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                ${stats.totalSpent || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No recent activity to display. Post a project to get started!
                </Typography>
                <Button variant="contained" component={Link} to="/dashboard/projects/new" sx={{ mt: 2 }}>
                  Post New Project
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Button variant="outlined" fullWidth component={Link} to="/freelancers">
                  Find Talent
                </Button>
                <Button variant="outlined" fullWidth component={Link} to="/dashboard/profile">
                  Update Profile
                </Button>
                <Button variant="outlined" fullWidth component={Link} to="/dashboard/messages">
                  Messages
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
