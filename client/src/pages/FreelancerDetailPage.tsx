import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Paper, Chip, Button, Grid, Avatar, Rating } from '@mui/material';
import { LocationOn, Verified } from '@mui/icons-material';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useFreelancer } from '@/hooks/api/useUsers';

export const FreelancerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: freelancerResponse, isLoading, error } = useFreelancer(id || '');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !freelancerResponse?.data) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          Freelancer not found
        </Typography>
      </Container>
    );
  }

  const freelancer = freelancerResponse.data;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 3, mb: 4 }}>
          <Avatar
            src={freelancer.profile.avatar}
            sx={{ width: 120, height: 120 }}
          >
            {freelancer.profile.firstName[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h4">
                {freelancer.profile.firstName} {freelancer.profile.lastName}
              </Typography>
              {freelancer.isVerified && (
                <Verified color="primary" />
              )}
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {freelancer.freelancerProfile.title}
            </Typography>
            {freelancer.profile.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {freelancer.profile.location}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Rating value={freelancer.rating.average} readOnly precision={0.1} />
              <Typography variant="body2">
                {freelancer.rating.average.toFixed(1)} ({freelancer.rating.count} reviews)
              </Typography>
            </Box>
            <Chip
              label={freelancer.freelancerProfile.availability.status}
              color={freelancer.freelancerProfile.availability.status === 'available' ? 'success' : 'default'}
            />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" color="primary" gutterBottom>
              ${freelancer.freelancerProfile.hourlyRate}/hr
            </Typography>
            <Button variant="contained" size="large">
              Hire Now
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            <Typography variant="body1">
              {freelancer.profile.bio || 'No bio available'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Skills
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {freelancer.freelancerProfile.skills.map((skill) => (
                <Chip key={skill} label={skill} variant="outlined" />
              ))}
            </Box>
          </Grid>

          {freelancer.freelancerProfile.portfolio && freelancer.freelancerProfile.portfolio.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Portfolio
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {freelancer.freelancerProfile.portfolio.length} items
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};
