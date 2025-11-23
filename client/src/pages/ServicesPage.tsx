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
  name: string;
  description: string;
  price: number;
  deliveryTime: number;
  revisions: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export const ServicesPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch service packages
  const { data: packagesData, isLoading, error, refetch } = useQuery({
    queryKey: ['service-packages'],
    queryFn: async () => {
      const response = await apiCore.get('/services/packages');
      return response.data.data;
    },
    enabled: !!user,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing && selectedPackage) {
        const response = await apiCore.patch(`/services/packages/${selectedPackage._id}`, data);
        return response.data.data;
      } else {
        const response = await apiCore.post('/services/packages', data);
        return response.data.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-packages'] });
      toast.success(isEditing ? 'Service package updated' : 'Service package created');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save service package');
    },
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

  const handleSave = (data: any) => {
    saveMutation.mutate(data);
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

  const packages = packagesData || [];

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
                    {pkg.name}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {pkg.description}
                  </Typography>
                  <Typography variant="h5" color="primary" gutterBottom>
                    ${pkg.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                        {pkg.features.map((feature, idx) => (
                          <li key={idx}>
                            <Typography variant="caption">{feature}</Typography>
                          </li>
                        ))}
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
        <DialogTitle>
          {isEditing ? 'Edit Service Package' : 'Create Service Package'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <ServicePackageForm
            initialData={selectedPackage || undefined}
            onSubmit={handleSave}
            isLoading={saveMutation.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
