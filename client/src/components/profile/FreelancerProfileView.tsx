import { Box, Typography, Paper, Chip, Grid, Avatar, Divider, CircularProgress } from '@mui/material';
import { LocationOn, Work, AttachMoney, Verified } from '@mui/icons-material';
import { ProfileStatistics } from './ProfileStatistics';
import { ProjectHistoryCard } from './ProjectHistoryCard';
import { RatingDistribution } from './RatingDistribution';
import { useEffect, useState } from 'react';
import { usersService } from '@/services/api/users.service';
import toast from 'react-hot-toast';

interface FreelancerProfileViewProps {
  userId: string;
}

export const FreelancerProfileView = ({ userId }: FreelancerProfileViewProps) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await usersService.getFreelancerProfile(userId);
        setProfile(data);
        
        // Track profile view
        await usersService.trackProfileView(userId);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Profile not found
        </Typography>
      </Box>
    );
  }

  const { user, stats, projects, ratingDistribution } = profile;

  return (
    <Box>
      {/* Profile Header */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
          <Avatar
            src={user.avatar}
            sx={{ width: 120, height: 120, mr: 3 }}
          >
            {user.firstName[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, mr: 1 }}>
                {user.firstName} {user.lastName}
              </Typography>
              {user.isVerified && (
                <Verified sx={{ color: 'primary.main', fontSize: 28 }} />
              )}
            </Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {user.title || 'Freelancer'}
            </Typography>
            {user.bio && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                {user.bio}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              {user.location && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ fontSize: 18, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2">{user.location}</Typography>
                </Box>
              )}
              {user.hourlyRate && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ fontSize: 18, mr: 0.5, color: 'success.main' }} />
                  <Typography variant="body2">${user.hourlyRate}/hr</Typography>
                </Box>
              )}
              {user.experience && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Work sx={{ fontSize: 18, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2">{user.experience}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {user.skills.map((skill: string, index: number) => (
                <Chip key={index} label={skill} size="small" />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Statistics */}
      <Box sx={{ mb: 3 }}>
        <ProfileStatistics stats={stats} role="freelancer" />
      </Box>

      {/* Rating Distribution */}
      {ratingDistribution && stats.totalReviews > 0 && (
        <Box sx={{ mb: 3 }}>
          <RatingDistribution
            ratings={ratingDistribution}
            totalReviews={stats.totalReviews}
            averageRating={stats.averageRating}
          />
        </Box>
      )}

      <Divider sx={{ my: 4 }} />

      {/* Project History */}
      <Box>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Project History
        </Typography>
        {projects && projects.length > 0 ? (
          projects.map((project: any) => (
            <ProjectHistoryCard key={project._id} project={project} role="freelancer" />
          ))
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No completed projects yet</Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};
