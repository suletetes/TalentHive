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
  stats?: {
    totalProjectsPosted?: number;
    [key: string]: any;
  };
  isOwnProfile?: boolean;
  onEdit?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  stats,
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
    console.log(' [AVATAR] Upload callback received, URLs:', urls);
    if (urls.length > 0) {
      console.log(' [AVATAR] Invalidating profile cache...');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setAvatarDialogOpen(false);
      toast.success('Avatar updated successfully!');
      console.log(' [AVATAR] Profile cache invalidated, should refetch now');
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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'center', sm: 'start' }, 
        gap: 3, 
        mb: 3,
        textAlign: { xs: 'center', sm: 'left' }
      }}>
        {/* Avatar */}
        <Box position="relative" sx={{ flexShrink: 0 }}>
          <Avatar
            src={user.profile.avatar}
            alt={`${user.profile.firstName} ${user.profile.lastName}`}
            sx={{ width: { xs: 100, sm: 120 }, height: { xs: 100, sm: 120 } }}
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
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'center' }, 
            justifyContent: { xs: 'center', sm: 'space-between' }, 
            gap: { xs: 1, sm: 0 },
            mb: 1 
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center', 
              gap: 1 
            }}>
              <Typography variant="h4" component="h1" sx={{ 
                fontSize: { xs: '1.75rem', sm: '2.125rem' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                {user.profile.firstName} {user.profile.lastName}
              </Typography>
              {user.verificationBadges?.some(badge => badge.type === 'identity' && badge.status === 'approved') && (
                <Verified color="primary" />
              )}
            </Box>

            {isOwnProfile && onEdit && (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={onEdit}
                size="small"
                sx={{ mt: { xs: 1, sm: 0 } }}
              >
                Edit Profile
              </Button>
            )}
          </Box>

          {/* Role-specific title */}
          {user.role === 'freelancer' && user.freelancerProfile && (
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              {user.freelancerProfile.title}
            </Typography>
          )}

          {user.role === 'client' && user.clientProfile?.companyName && (
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              {user.clientProfile.companyName}
            </Typography>
          )}

          {/* Location and Timezone */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center', 
            gap: 2, 
            mb: 2,
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
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
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center', 
            gap: { xs: 1, sm: 3 }, 
            mb: 2,
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}>
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
            <Typography variant="body1" paragraph sx={{
              textAlign: { xs: 'center', sm: 'left' },
              maxWidth: { xs: '100%', sm: 'none' }
            }}>
              {user.profile.bio}
            </Typography>
          )}

          {/* Skills (for freelancers) */}
          {user.role === 'freelancer' && user.freelancerProfile?.skills && user.freelancerProfile.skills.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                Skills
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 0.5,
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}>
                {user.freelancerProfile?.skills?.map((skill) => (
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
          {user.role === 'freelancer' && user.freelancerProfile?.hourlyRate && user.freelancerProfile.hourlyRate > 0 && (
            <Box sx={{ 
              mt: 2,
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              <Typography variant="h5" color="primary">
                ${user.freelancerProfile?.hourlyRate}/hour
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Starting rate
              </Typography>
            </Box>
          )}

          {/* Projects Posted (for clients) */}
          {user.role === 'client' && user.clientProfile && (
            <Box sx={{ 
              mt: 2,
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              <Typography variant="h6" color="primary">
                {stats?.totalProjectsPosted ?? user.clientProfile.projectsPosted ?? 0} Projects Posted
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