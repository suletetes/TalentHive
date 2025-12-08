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
  Tabs,
  Tab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Divider,
  Chip,
  Link as MuiLink,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  CardMembership as CertificationIcon,
  Language as LanguageIcon,
  OpenInNew,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as yup from 'yup';
import toast from 'react-hot-toast';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { SkillsManager } from '@/components/profile/SkillsManager';
import { PortfolioManager } from '@/components/profile/PortfolioManager';
import { WorkExperienceManager } from '@/components/profile/WorkExperienceManager';
import { EducationManager } from '@/components/profile/EducationManager';
import { CertificationsManager } from '@/components/profile/CertificationsManager';
import { LanguagesManager } from '@/components/profile/LanguagesManager';
import { ProfileStatistics } from '@/components/profile/ProfileStatistics';
import { ProfileSlugEditor } from '@/components/profile/ProfileSlugEditor';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RootState } from '@/store';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState(0);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
        availability: {
          status: user?.freelancerProfile?.availability?.status || 'available',
        },
        workExperience: user?.freelancerProfile?.workExperience || [],
        education: user?.freelancerProfile?.education || [],
        certifications: user?.freelancerProfile?.certifications || [],
        languages: user?.freelancerProfile?.languages || [],
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

        {/* Profile Slug Editor */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ProfileSlugEditor userId={user._id} currentSlug={user.profileSlug} />
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={user.role === 'freelancer' ? 6 : 12}>
          <ProfileStatistics userId={user._id} role={user.role} />
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

        {/* Work Experience Section (for freelancers) */}
        {user.role === 'freelancer' && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <WorkExperienceManager
                  workExperience={user.freelancerProfile?.workExperience || []}
                  isEditable={true}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Education Section (for freelancers) */}
        {user.role === 'freelancer' && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <EducationManager
                  education={user.freelancerProfile?.education || []}
                  isEditable={true}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Certifications Section (for freelancers) */}
        {user.role === 'freelancer' && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <CertificationsManager
                  certifications={user.freelancerProfile?.certifications || []}
                  isEditable={true}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Languages Section (for freelancers) */}
        {user.role === 'freelancer' && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <LanguagesManager
                  languages={user.freelancerProfile?.languages || []}
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      name="freelancerProfile.availability.status"
                      label="Availability Status"
                      value={formik.values.freelancerProfile.availability?.status || 'available'}
                      onChange={formik.handleChange}
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="not_available">Not Available</option>
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                      <Typography variant="body2" color="info.main">
                        <strong>Note:</strong> To manage your Work Experience, Education, Certifications, and Languages, 
                        these sections are displayed on your profile page. You can view them there, and full editing 
                        capabilities for these detailed sections will be available in a future update.
                      </Typography>
                    </Box>
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