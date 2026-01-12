import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const HireNowSentPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch sent hire now requests
  const { data: requestsData, isLoading, error, refetch } = useQuery({
    queryKey: ['hire-now-sent'],
    queryFn: async () => {
      const response = await apiService.get('/hire-now/sent');
      return response.data?.data || [];
    },
    enabled: user?.role === 'client',
  });

  // Cancel hire now request mutation
  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => apiService.delete(`/hire-now/${requestId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hire-now-sent'] });
      toast.success('Hire Now request cancelled');
      setDetailsDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    },
  });

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  if (user?.role !== 'client') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          This page is only accessible to clients.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading hire now requests..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={error} onRetry={refetch} />
      </Container>
    );
  }

  const requests = requestsData || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Hire Now Requests Sent
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track all the direct hire requests you've sent to freelancers
      </Typography>

      {requests.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              You haven't sent any hire now requests yet. Browse freelancers and send direct hire requests!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {requests.map((request: any) => (
            <Grid item xs={12} key={request._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {request.projectTitle}
                      </Typography>
                      <Box display="flex" gap={2} alignItems="center" mb={1}>
                        <Chip
                          label={request.status.toUpperCase()}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          Sent: {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="h6" color="primary">
                        ${request.budget}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.timeline?.duration} {request.timeline?.unit}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    To: {request.freelancer?.profile?.firstName} {request.freelancer?.profile?.lastName}
                  </Typography>

                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewDetails(request)}
                    >
                      View Details
                    </Button>
                    {request.status === 'pending' && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          setSelectedRequest(request);
                          if (window.confirm('Cancel this hire now request?')) {
                            cancelMutation.mutate(request._id);
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedRequest(null);
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedRequest && (
          <>
            <DialogTitle>Hire Now Request Details</DialogTitle>
            <DialogContent dividers>
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Project Title
                </Typography>
                <Typography variant="body1">{selectedRequest.projectTitle}</Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Freelancer
                </Typography>
                <Typography variant="body1">
                  {selectedRequest.freelancer?.profile?.firstName} {selectedRequest.freelancer?.profile?.lastName}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={selectedRequest.status.toUpperCase()}
                  color={getStatusColor(selectedRequest.status)}
                  size="small"
                />
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Budget
                </Typography>
                <Typography variant="h6" color="primary">
                  ${selectedRequest.budget}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Timeline
                </Typography>
                <Typography variant="body1">
                  {selectedRequest.timeline?.duration} {selectedRequest.timeline?.unit}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Project Description
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedRequest.projectDescription}
                </Typography>
              </Box>

              {selectedRequest.message && (
                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Your Message
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedRequest.message}
                  </Typography>
                </Box>
              )}

              {selectedRequest.milestones && selectedRequest.milestones.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Milestones
                  </Typography>
                  {selectedRequest.milestones.map((milestone: any, index: number) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {milestone.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {milestone.description}
                        </Typography>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">
                            Amount: ${milestone.amount}
                          </Typography>
                          <Typography variant="body2">
                            Due: {format(new Date(milestone.dueDate), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Sent on {format(new Date(selectedRequest.createdAt), 'MMMM dd, yyyy')}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default HireNowSentPage;
