import React from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
  Rating,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { LocationOn, Verified, Favorite, FavoriteBorder } from '@mui/icons-material';
import { Link } from 'react-router-dom';

interface FreelancerCardProps {
  freelancer: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
      location?: string;
    };
    freelancerProfile: {
      title: string;
      hourlyRate: number;
      skills: string[];
      availability: {
        status: 'available' | 'busy' | 'unavailable';
      };
    };
    rating: {
      average: number;
      count: number;
    };
    isVerified: boolean;
  };
  onFavorite?: (freelancerId: string) => void;
  isFavorited?: boolean;
  showFavorite?: boolean;
}

export const FreelancerCard: React.FC<FreelancerCardProps> = ({
  freelancer,
  onFavorite,
  isFavorited = false,
  showFavorite = false,
}) => {
  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'busy':
        return 'warning';
      case 'unavailable':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'busy':
        return 'Busy';
      case 'unavailable':
        return 'Unavailable';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="start" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={freelancer.profile.avatar}
              alt={`${freelancer.profile.firstName} ${freelancer.profile.lastName}`}
              sx={{ width: 60, height: 60 }}
            />
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" component="h3">
                  {freelancer.profile.firstName} {freelancer.profile.lastName}
                </Typography>
                {freelancer.isVerified && (
                  <Tooltip title="Verified freelancer">
                    <Verified color="primary" fontSize="small" />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {freelancer.freelancerProfile.title}
              </Typography>
              {freelancer.profile.location && (
                <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {freelancer.profile.location}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {showFavorite && onFavorite && (
            <IconButton
              onClick={() => onFavorite(freelancer._id)}
              color={isFavorited ? 'error' : 'default'}
            >
              {isFavorited ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          )}
        </Box>

        {/* Rating and Availability */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Rating
              value={freelancer.rating.average}
              readOnly
              size="small"
              precision={0.1}
            />
            <Typography variant="body2" color="text.secondary">
              {freelancer.rating.average.toFixed(1)} ({freelancer.rating.count})
            </Typography>
          </Box>

          <Chip
            label={getAvailabilityText(freelancer.freelancerProfile.availability.status)}
            color={getAvailabilityColor(freelancer.freelancerProfile.availability.status) as any}
            size="small"
          />
        </Box>

        {/* Skills */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Skills
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {freelancer.freelancerProfile.skills.slice(0, 6).map((skill) => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                variant="outlined"
              />
            ))}
            {freelancer.freelancerProfile.skills.length > 6 && (
              <Chip
                label={`+${freelancer.freelancerProfile.skills.length - 6} more`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Box>
        </Box>

        {/* Hourly Rate */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mt="auto">
          <Box>
            <Typography variant="h6" color="primary">
              ${freelancer.freelancerProfile.hourlyRate}/hr
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Starting rate
            </Typography>
          </Box>

          <Button
            variant="contained"
            component={Link}
            to={`/freelancers/${freelancer._id}`}
            size="small"
          >
            View Profile
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};