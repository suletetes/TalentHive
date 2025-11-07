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
import { Work, Person, Payment, Star } from '@mui/icons-material';

export const DashboardPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back! Here's an overview of your account.
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Work color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Projects</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                5
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2 new this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Person color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Clients</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                12
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3 new this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Payment color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Earnings</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                $2,450
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This month
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
                4.9
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Based on 25 reviews
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
                <Button variant="contained" fullWidth>
                  Post New Project
                </Button>
                <Button variant="outlined" fullWidth>
                  Update Profile
                </Button>
                <Button variant="outlined" fullWidth>
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