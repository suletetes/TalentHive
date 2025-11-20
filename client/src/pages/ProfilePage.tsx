import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as yup from 'yup';
import toast from 'react-hot-toast';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { SkillsManager } from '@/components/profile/SkillsManager';
import { PortfolioManager } from '@/components/profile/PortfolioManager';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RootState } from '@/store';
import { apiService } from '@/services/api';

const profileSchema = yup.object({
  profile: yup.object({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    bio: yup.string().max(1000, 'Bio cannot exceed 1000 characters'),
    location: yup.string(),
    timezone: yup.string(),
  }),
  freelancerProfile: yup.object().when('role', {
    is: 'freelancer',
    then: (schema) => schema.shape({
      title: yup.string().required('Professional title is required'),
      hourlyRate: yup.number().min(0, 'Rate must be positive'),
    }),
  }),
  clientProfile: yup.object().when('role', {
    is: 'client',
    then: (schema) => schema.shape({
      companyName: yup.string(),
      industry: yup.string(),
    }),
  }),
});

export const ProfilePage: React.FC = () => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiService.get('/users/profile'),
    enabled: !!currentUser,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiService.put('/users/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully!');
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const user = profileData?.data?.user;

  const formik = useFormik({
    initialValues: {
      profile: {
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        bio: user?.profile?.bio || '',
        location: user?.profile?.location || '',
        timezone: user?.profile?.timezone || '',
      },
      freelancerProfile: {
        title: user?.freelancerProfile?.title || '',
        hourlyRate: user?.freelancerProfile?.hourlyRate || 0,
      },
      clientProfile: {
        companyName: user?.clientProfile?.companyName || '',
        industry: user?.clientProfile?.industry || '',
      },
    },
    validationSchema: profileSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      const updateData: any = {
        profile: values.profile,
      };

      if (user?.role === 'freelancer') {
        updateData.freelancerProfile = values.freelancerProfile;
      } else if (user?.role === 'client') {
        updateData.clientProfile = values.clientProfile;
      }

      updateProfileMutation.mutate(updateData);
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          Profile not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ProfileHeader
                user={user}
                isOwnProfile={true}
                onEdit={() => setEditDialogOpen(true)}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Skills Section (for freelancers) */}
        {user.role === 'freelancer' && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <SkillsManager
                  skills={user.freelancerProfile?.skills || []}
                  skillRates={user.freelancerProfile?.skillRates || []}
                  isEditable={true}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Statistics */}
        <Grid item xs={12} md={user.role === 'freelancer' ? 6 : 12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {user.role === 'freelancer' && (
                  <>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Projects Completed:</Typography>
                      <Typography fontWeight="bold">
                        {user.freelancerProfile?.portfolio?.length || 0}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Client Rating:</Typography>
                      <Typography fontWeight="bold">
                        {user.rating.count > 0 
                          ? `${user.rating.average.toFixed(1)}/5.0`
                          : 'No ratings yet'
                        }
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Skills:</Typography>
                      <Typography fontWeight="bold">
                        {user.freelancerProfile?.skills?.length || 0}
                      </Typography>
                    </Box>
                  </>
                )}
                
                {user.role === 'client' && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Projects Posted:</Typography>
                    <Typography fontWeight="bold">
                      {user.clientProfile?.projectsPosted || 0}
                    </Typography>
                  </Box>
                )}
                
                <Box display="flex" justifyContent="space-between">
                  <Typography>Member Since:</Typography>
                  <Typography fontWeight="bold">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Portfolio Section (for freelancers) */}
        {user.role === 'freelancer' && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <PortfolioManager
                  portfolioItems={user.freelancerProfile?.portfolio || []}
                  isEditable={true}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="profile.firstName"
                  label="First Name"
                  value={formik.values.profile.firstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.profile?.firstName && Boolean(formik.errors.profile?.firstName)}
                  helperText={formik.touched.profile?.firstName && formik.errors.profile?.firstName as string}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="profile.lastName"
                  label="Last Name"
                  value={formik.values.profile.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.profile?.lastName && Boolean(formik.errors.profile?.lastName)}
                  helperText={formik.touched.profile?.lastName && formik.errors.profile?.lastName as string}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="profile.bio"
                  label="Bio"
                  multiline
                  rows={4}
                  value={formik.values.profile.bio}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.profile?.bio && Boolean(formik.errors.profile?.bio)}
                  helperText={formik.touched.profile?.bio && formik.errors.profile?.bio as string}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="profile.location"
                  label="Location"
                  value={formik.values.profile.location}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="profile.timezone"
                  label="Timezone"
                  value={formik.values.profile.timezone}
                  onChange={formik.handleChange}
                />
              </Grid>

              {/* Freelancer-specific fields */}
              {user.role === 'freelancer' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="freelancerProfile.title"
                      label="Professional Title"
                      value={formik.values.freelancerProfile.title}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.freelancerProfile?.title && Boolean(formik.errors.freelancerProfile?.title)}
                      helperText={formik.touched.freelancerProfile?.title && formik.errors.freelancerProfile?.title as string}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="freelancerProfile.hourlyRate"
                      label="Hourly Rate ($)"
                      type="number"
                      value={formik.values.freelancerProfile.hourlyRate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.freelancerProfile?.hourlyRate && Boolean(formik.errors.freelancerProfile?.hourlyRate)}
                      helperText={formik.touched.freelancerProfile?.hourlyRate && formik.errors.freelancerProfile?.hourlyRate as string}
                    />
                  </Grid>
                </>
              )}

              {/* Client-specific fields */}
              {user.role === 'client' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="clientProfile.companyName"
                      label="Company Name"
                      value={formik.values.clientProfile.companyName}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="clientProfile.industry"
                      label="Industry"
                      value={formik.values.clientProfile.industry}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => formik.handleSubmit()}
            variant="contained"
            disabled={updateProfileMutation.isPending}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};