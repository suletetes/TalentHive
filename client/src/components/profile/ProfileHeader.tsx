import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Button,
  Chip,
  Rating,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  LinearProgress,
} from '@mui/material';
import {
  Edit,
  LocationOn,
  Schedule,
  Verified,
  CameraAlt,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { ImageUpload } from './ImageUpload';
import { apiService } from '@/services/api';

interface ProfileHeaderProps {
  user: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
      bio?: string;
      location?: string;
      timezone?: string;
    };
    freelancerProfile?: {
      title: string;
      hourlyRate: number;
      skills: string[];
      availability: {
        status: 'available' | 'busy' | 'unavailable';
      };
    };
    clientProfile?: {
      companyName?: string;
      industry?: string;
      projectsPosted: number;
    };
    rating: {
      average: number;
      count: number;
    };
    isVerified: boolean;
    role: 'freelancer' | 'client' | 'admin';
  };
  isOwnProfile?: boolean;
  onEdit?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isOwnProfile = false,
  onEdit,
}) => {
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const queryClient = useQueryClient();

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
        return 'Available for work';
      case 'busy':
        return 'Busy';
      case 'unavailable':
        return 'Not available';
      default:
        return 'Unknown';
    }
  };

  const getProfileCompleteness = () => {
    let completeness = 0;
    const totalFields = user.role === 'freelancer' ? 8 : 6;

    // Basic profile fields
    if (user.profile.firstName) completeness++;
    if (user.profile.lastName) completeness++;
    if (user.profile.avatar) completeness++;
    if (user.profile.bio) completeness++;
    if (user.profile.location) completeness++;

    if (user.role === 'freelancer' && user.freelancerProfile) {
      if (user.freelancerProfile.title) completeness++;
      if (user.freelancerProfile.hourlyRate > 0) completeness++;
      if (user.freelancerProfile.skills.length > 0) completeness++;
    } else if (user.role === 'client' && user.clientProfile) {
      if (user.clientProfile.companyName) completeness++;
    }

    return Math.round((completeness / totalFields) * 100);
  };

  const handleAvatarUpload = (urls: string[]) => {
    if (urls.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarDialogOpen(false);
      toast.success('Avatar updated successfully!');
    }
  };

  return (
    <Box>
      {/* Profile Completeness Bar (only for own profile) */}
      {isOwnProfile && (
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Profile Completeness
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getProfileCompleteness()}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getProfileCompleteness()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}

      {/* Main Profile Header */}
      <Box display="flex" alignItems="start" gap={3} mb={3}>
        {/* Avatar */}
        <Box position="relative">
          <Avatar
            src={user.profile.avatar}
            alt={`${user.profile.firstName} ${user.profile.lastName}`}
            sx={{ width: 120, height: 120 }}
          />
          {isOwnProfile && (
            <IconButton
              size="small"
              onClick={() => setAvatarDialogOpen(true)}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <CameraAlt fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Profile Info */}
        <Box flexGrow={1}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h4" component="h1">
                {user.profile.firstName} {user.profile.lastName}
              </Typography>
              {user.isVerified && (
                <Verified color="primary" />
              )}
            </Box>

            {isOwnProfile && onEdit && (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={onEdit}
              >
                Edit Profile
              </Button>
            )}
          </Box>

          {/* Role-specific title */}
          {user.role === 'freelancer' && user.freelancerProfile && (
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {user.freelancerProfile.title}
            </Typography>
          )}

          {user.role === 'client' && user.clientProfile?.companyName && (
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {user.clientProfile.companyName}
            </Typography>
          )}

          {/* Location and Timezone */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            {user.profile.location && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {user.profile.location}
                </Typography>
              </Box>
            )}

            {user.profile.timezone && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Schedule fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {user.profile.timezone}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Rating and Availability */}
          <Box display="flex" alignItems="center" gap={3} mb={2}>
            {user.rating.count > 0 && (
              <Box display="flex" alignItems="center" gap={1}>
                <Rating
                  value={user.rating.average}
                  readOnly
                  size="small"
                  precision={0.1}
                />
                <Typography variant="body2" color="text.secondary">
                  {user.rating.average.toFixed(1)} ({user.rating.count} reviews)
                </Typography>
              </Box>
            )}

            {user.role === 'freelancer' && user.freelancerProfile && (
              <Chip
                label={getAvailabilityText(user.freelancerProfile.availability.status)}
                color={getAvailabilityColor(user.freelancerProfile.availability.status) as any}
                size="small"
              />
            )}
          </Box>

          {/* Bio */}
          {user.profile.bio && (
            <Typography variant="body1" paragraph>
              {user.profile.bio}
            </Typography>
          )}

          {/* Skills (for freelancers) */}
          {user.role === 'freelancer' && user.freelancerProfile?.skills.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Skills
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {user.freelancerProfile.skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Hourly Rate (for freelancers) */}
          {user.role === 'freelancer' && user.freelancerProfile?.hourlyRate > 0 && (
            <Box mt={2}>
              <Typography variant="h5" color="primary">
                ${user.freelancerProfile.hourlyRate}/hour
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Starting rate
              </Typography>
            </Box>
          )}

          {/* Projects Posted (for clients) */}
          {user.role === 'client' && user.clientProfile && (
            <Box mt={2}>
              <Typography variant="h6" color="primary">
                {user.clientProfile.projectsPosted} Projects Posted
              </Typography>
              {user.clientProfile.industry && (
                <Typography variant="body2" color="text.secondary">
                  Industry: {user.clientProfile.industry}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Avatar Upload Dialog */}
      <Dialog
        open={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Avatar</DialogTitle>
        <DialogContent>
          <ImageUpload
            onUpload={handleAvatarUpload}
            multiple={false}
            maxFiles={1}
            folder="avatar"
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};