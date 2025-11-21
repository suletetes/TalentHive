import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  IconButton,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Rating,
} from '@mui/material';
import {
  DragIndicator,
  Delete as DeleteIcon,
  Add as AddIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/ToastProvider';

interface Freelancer {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  freelancerProfile: {
    title?: string;
    hourlyRate?: number;
  };
  rating: {
    average: number;
    count: number;
  };
  isFeatured?: boolean;
}

export const FeaturedFreelancersManager: React.FC = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch featured freelancers
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['admin-featured-freelancers'],
    queryFn: async () => {
      const response = await apiService.get('/admin/featured-freelancers');
      return response.data.data.freelancers;
    },
  });

  // Fetch all freelancers for adding
  const { data: allFreelancersData, isLoading: allLoading } = useQuery({
    queryKey: ['all-freelancers'],
    queryFn: async () => {
      const response = await apiService.get('/users/freelancers');
      return response.data.data;
    },
    enabled: addDialogOpen,
  });

  // Feature freelancer mutation
  const featureMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiService.post(`/admin/featured-freelancers/${userId}/feature`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-featured-freelancers'] });
      queryClient.invalidateQueries({ queryKey: ['featured-freelancers'] });
      toast.success('Freelancer featured successfully');
      setAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to feature freelancer');
    },
  });

  // Unfeature freelancer mutation
  const unfeatureMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiService.delete(`/admin/featured-freelancers/${userId}/unfeature`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-featured-freelancers'] });
      queryClient.invalidateQueries({ queryKey: ['featured-freelancers'] });
      toast.success('Freelancer unfeatured successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unfeature freelancer');
    },
  });

  const featuredFreelancers: Freelancer[] = featuredData || [];
  const allFreelancers: Freelancer[] = allFreelancersData || [];
  const availableFreelancers = allFreelancers.filter(
    (f) => !featuredFreelancers.some((ff) => ff._id === f._id)
  );

  if (featuredLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Featured Freelancers</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            disabled={featuredFreelancers.length >= 10}
          >
            Add Featured
          </Button>
        </Box>

        {featuredFreelancers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No featured freelancers yet. Add some to showcase on the homepage.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {featuredFreelancers.map((freelancer) => (
              <Grid item xs={12} sm={6} md={4} key={freelancer._id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        src={freelancer.profile.avatar}
                        sx={{ width: 56, height: 56, mr: 2 }}
                      >
                        {freelancer.profile.firstName[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1">
                          {freelancer.profile.firstName} {freelancer.profile.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {freelancer.freelancerProfile?.title || 'Freelancer'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Rating value={freelancer.rating.average} readOnly size="small" />
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            ({freelancer.rating.count})
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => unfeatureMutation.mutate(freelancer._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Chip
                      icon={<StarIcon />}
                      label="Featured"
                      color="primary"
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Add Featured Freelancer Dialog */}
        <Dialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Featured Freelancer</DialogTitle>
          <DialogContent>
            {allLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LoadingSpinner />
              </Box>
            ) : availableFreelancers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No available freelancers to feature.
              </Typography>
            ) : (
              <List>
                {availableFreelancers.map((freelancer) => (
                  <ListItem key={freelancer._id} divider>
                    <ListItemAvatar>
                      <Avatar src={freelancer.profile.avatar}>
                        {freelancer.profile.firstName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${freelancer.profile.firstName} ${freelancer.profile.lastName}`}
                      secondary={
                        <>
                          {freelancer.freelancerProfile?.title || 'Freelancer'}
                          <br />
                          <Rating value={freelancer.rating.average} readOnly size="small" />
                          {` (${freelancer.rating.count} reviews)`}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => featureMutation.mutate(freelancer._id)}
                        disabled={featureMutation.isPending}
                      >
                        Feature
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
