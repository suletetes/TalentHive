import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  Avatar,
} from '@mui/material';
import { Star as StarIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminService, AdminUser } from '@/services/api/admin.service';

export const FeaturedFreelancersManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch all freelancers
  const { data: allFreelancers, isLoading: isLoadingFreelancers } = useQuery({
    queryKey: ['admin-freelancers'],
    queryFn: async () => {
      const response = await adminService.getUsers({
        role: 'freelancer',
        limit: 100,
      });
      return response.data.users;
    },
  });

  // Feature freelancer mutation
  const featureMutation = useMutation({
    mutationFn: (userId: string) => adminService.featureFreelancer(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-freelancers'] });
      queryClient.invalidateQueries({ queryKey: ['featured-freelancers'] });
      toast.success('Freelancer featured successfully');
      setDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to feature freelancer');
    },
  });

  // Unfeature freelancer mutation
  const unfeatureMutation = useMutation({
    mutationFn: (userId: string) => adminService.unfeatureFreelancer(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-freelancers'] });
      queryClient.invalidateQueries({ queryKey: ['featured-freelancers'] });
      toast.success('Freelancer unfeatured successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unfeature freelancer');
    },
  });

  const filteredFreelancers = allFreelancers?.filter((f) =>
    f.email.toLowerCase().includes(searchEmail.toLowerCase())
  ) || [];

  const featuredFreelancers = filteredFreelancers.filter((f: any) => f.isFeatured);
  const availableFreelancers = filteredFreelancers.filter((f: any) => !f.isFeatured);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Featured Freelancers */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Featured Freelancers ({featuredFreelancers.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Featured Since</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {featuredFreelancers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No featured freelancers yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  featuredFreelancers.map((freelancer: any) => (
                    <TableRow key={freelancer._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar src={freelancer.profile?.avatar} sx={{ width: 32, height: 32 }} />
                          {freelancer.profile?.firstName} {freelancer.profile?.lastName}
                        </Box>
                      </TableCell>
                      <TableCell>{freelancer.email}</TableCell>
                      <TableCell>
                        {freelancer.featuredSince
                          ? new Date(freelancer.featuredSince).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => unfeatureMutation.mutate(freelancer._id)}
                          disabled={unfeatureMutation.isPending}
                        >
                          Unfeature
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Available Freelancers */}
      <Card>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Available Freelancers ({availableFreelancers.length})
            </Typography>
            <TextField
              size="small"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              sx={{ width: '100%', maxWidth: 300 }}
            />
          </Box>

          {isLoadingFreelancers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Joined</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableFreelancers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No available freelancers</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    availableFreelancers.map((freelancer: any) => (
                      <TableRow key={freelancer._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={freelancer.profile?.avatar} sx={{ width: 32, height: 32 }} />
                            {freelancer.profile?.firstName} {freelancer.profile?.lastName}
                          </Box>
                        </TableCell>
                        <TableCell>{freelancer.email}</TableCell>
                        <TableCell>
                          {new Date(freelancer.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            color="primary"
                            startIcon={<StarIcon />}
                            onClick={() => {
                              setSelectedUser(freelancer);
                              setDialogOpen(true);
                            }}
                            disabled={featureMutation.isPending}
                          >
                            Feature
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Feature Freelancer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to feature{' '}
            <strong>
              {selectedUser?.profile?.firstName} {selectedUser?.profile?.lastName}
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedUser && featureMutation.mutate(selectedUser._id)}
            variant="contained"
            disabled={featureMutation.isPending}
          >
            {featureMutation.isPending ? <CircularProgress size={24} /> : 'Feature'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
