import React from 'react';
import { Container, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { FreelancerAnalytics } from '@/components/profile/FreelancerAnalytics';
import { ClientAnalytics } from '@/components/profile/ClientAnalytics';
import { AdminAnalytics } from '@/components/profile/AdminAnalytics';
import { RootState } from '@/store';
import { usersService } from '@/services/api/users.service';

export const ProfileAnalyticsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Determine which analytics component to render based on user role
  const renderAnalytics = () => {
    if (!user) return null;

    switch (user.role) {
      case 'freelancer':
        // FreelancerAnalytics fetches its own data
        return <FreelancerAnalytics userId={user.id} />;
      case 'client':
        // ClientAnalytics fetches its own data
        return <ClientAnalytics userId={user.id} />;
      case 'admin':
        return <AdminAnalytics analytics={{}} userId={user.id} />;
      default:
        return (
          <ErrorState message="Unknown user role. Unable to display analytics." />
        );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {user?.role === 'admin' ? 'Platform Analytics' : 'Profile Analytics'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        {user?.role === 'admin'
          ? 'Monitor platform performance and key metrics'
          : 'Track how your profile is performing and who\'s viewing it'}
      </Typography>

      {renderAnalytics()}
    </Container>
  );
};

export default ProfileAnalyticsPage;
