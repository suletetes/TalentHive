import React from 'react';
import { Card, CardContent, Box, Grid, Typography, Paper } from '@mui/material';
import {
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Description as ProposalIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

interface ClientAnalyticsProps {
  analytics: any;
  viewers: any[];
  userId: string;
}

export const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({
  analytics,
  viewers,
}) => {
  return (
    <Grid container spacing={3}>
      {/* Profile Views Stats */}
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

      {/* Client-Specific Stats */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WorkIcon sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">Projects Posted</Typography>
            </Box>
            <Typography variant="h3" color="warning.main">
              {analytics.projectsPosted || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total projects created
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ProposalIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6">Proposals Received</Typography>
            </Box>
            <Typography variant="h3" color="secondary.main">
              {analytics.proposalsReceived || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              From freelancers
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MoneyIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Total Spent</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              ${analytics.totalSpent || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              On completed projects
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Freelancers who viewed your profile
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
  );
};
