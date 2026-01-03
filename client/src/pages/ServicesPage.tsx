import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ServicePackageForm from '@/components/services/ServicePackageForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import toast from 'react-hot-toast';
import { apiCore } from '@/services/api/core';

interface ServicePackage {
  _id: string;
  title: string;
  description: string;
  category: string;
  pricing: {
    type: 'fixed' | 'hourly' | 'custom';
    amount?: number;
    hourlyRate?: number;
  };
  deliveryTime: number;
  revisions: number;
  features: string[];
  requirements?: string[];
  skills?: string[];
  createdAt: string;
  updatedAt: string;
}

export const ServicesPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Get user ID (support both _id and id)
  const userId = user?._id || user?.id;

  // Fetch service packages for current user
  const { data: packagesData, isLoading, error, refetch } = useQuery({
    queryKey: ['service-packages', userId],
    queryFn: async () => {
      if (!userId) return [];
      // Filter by current user's freelancer ID
      // apiCore.get returns response.data directly
      const response: any = await apiCore.get(`/services/packages?freelancerId=${userId}`);
      
      // API returns { status: 'success', data: { packages: [...] } }
      // After apiCore.get, we get { status: 'success', data: { packages: [...] } }
      let packages = [];
      if (response?.data?.packages && Array.isArray(response.data.packages)) {
        packages = response.data.packages;
      } else if (response?.packages && Array.isArray(response.packages)) {
        packages = response.packages;
      } else if (Array.isArray(response?.data)) {
        packages = response.data;
      } else if (Array.isArray(response)) {
        packages = response;
      }
      
      return packages;
    },
    enabled: !!userId,
  });



  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiCore.delete(`/services/packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-packages'] });
      toast.success('Service package deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete service package');
    },
  });

  const handleOpenDialog = (pkg?: ServicePackage) => {
    if (pkg) {
      setSelectedPackage(pkg);
      setIsEditing(true);
    } else {
      setSelectedPackage(null);
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPackage(null);
    setIsEditing(false);
  };

  const handleFormSuccess = () => {
    handleCloseDialog();
    queryClient.invalidateQueries({ queryKey: ['service-packages'] });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this service package?')) {
      deleteMutation.mutate(id);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          You must be logged in to access services.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading service packages..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={error} onRetry={() => refetch()} />
      </Container>
    );
  }

  const packages = Array.isArray(packagesData) ? packagesData : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Service Packages
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage your service offerings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Service Package
        </Button>
      </Box>

      {packages.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary" gutterBottom>
              No service packages yet
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ mt: 2 }}
            >
              Create Your First Service Package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {packages.map((pkg: ServicePackage) => (
            <Grid item xs={12} sm={6} md={4} key={pkg._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {pkg.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }} noWrap>
                    {pkg.description}
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {pkg.pricing?.type === 'hourly' 
                      ? `$${pkg.pricing?.hourlyRate || 0}/hr`
                      : `$${pkg.pricing?.amount || 0}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Delivery: {pkg.deliveryTime} days
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Revisions: {pkg.revisions}
                  </Typography>
                  {pkg.features && pkg.features.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Features:
                      </Typography>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                        {pkg.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx}>
                            <Typography variant="caption">{feature}</Typography>
                          </li>
                        ))}
                        {pkg.features.length > 3 && (
                          <li>
                            <Typography variant="caption" color="text.secondary">
                              +{pkg.features.length - 3} more
                            </Typography>
                          </li>
                        )}
                      </ul>
                    </Box>
                  )}
                </CardContent>
                <Box sx={{ display: 'flex', gap: 1, p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(pkg)}
                    fullWidth
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(pkg._id)}
                    fullWidth
                  >
                    Delete
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Service Package Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <ServicePackageForm
            initialData={selectedPackage}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ServicesPage;
