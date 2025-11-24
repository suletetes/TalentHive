import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Grid,
  Pagination,
  CircularProgress,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/ToastProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Check, Close } from '@mui/icons-material';

export const HireNowRequestsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const limit = 10;

  // Fetch received hire now requests
  const { data: requestsData, isLoading, isError } = useQuery({
    queryKey: ['hire-now-received', page],
    queryFn: async () => {
      const response = await apiService.get('/hire-now/received');
      return response.data?.data || [];
    },
    enabled: user?.role === 'freelancer',
  });

  // Accept hire now request
  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiService.put(`/hire-now/${id}/accept`, {
        responseMessage,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Hire Now request accepted! Contract created.');
      queryClient.invalidateQueries({ queryKey: ['hire-now-received'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept request');
    },
  });

  // Reject hire now request
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiService.put(`/hire-now/${id}/reject`, {
        responseMessage,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Hire Now request rejected.');
      queryClient.invalidateQueries({ queryKey: ['hire-now-received'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    },
  });

  const handleOpenDialog = (request: any, action: 'accept' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setResponseMessage('');
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setResponseMessage('');
  };

  const handleSubmitResponse = () => {
    if (!selectedRequest) return;

    if (actionType === 'accept') {
      acceptMutation.mutate(selectedRequest._id);
    } else if (actionType === 'reject') {
      rejectMutation.mutate(selectedRequest._id);
    }
  };

  if (user?.role !== 'freelancer') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          This page is only available for freelancers.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load hire now requests. Please try again later.
        </Alert>
      </Container>
    );
  }

  const requests = requestsData || [];
  const totalPages = Math.ceil(requests.length / limit);
  const paginatedRequests = requests.slice((page - 1) * limit, page * limit);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Hire Now Requests
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Review and respond to direct hire requests from clients
      </Typography>

      {requests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            No hire now requests yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When clients send you direct hire requests, they will appear here.
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedRequests.map((request: any) => (
              <Grid item xs={12} key={request._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {request.projectTitle}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            From: {request.client?.profile?.firstName} {request.client?.profile?.lastName}
                          </Typography>
                        </Box>
                        <Chip
                          label={request.status === 'pending' ? 'Pending' : request.status}
                          color={request.status === 'pending' ? 'warning' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" paragraph>
                      {request.projectDescription}
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Budget
                        </Typography>
                        <Typography variant="body1">
                          ${request.budget}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Timeline
                        </Typography>
                        <Typography variant="body1">
                          {request.timeline?.duration} {request.timeline?.unit}
                        </Typography>
                      </Grid>
                    </Grid>

                    {request.message && (
                      <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Message from Client
                        </Typography>
                        <Typography variant="body2">
                          {request.message}
                        </Typography>
                      </Box>
                    )}

                    {request.milestones && request.milestones.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Milestones
                        </Typography>
                        {request.milestones.map((milestone: any, index: number) => (
                          <Box key={index} sx={{ ml: 2, mb: 1 }}>
                            <Typography variant="body2">
                              {index + 1}. {milestone.title} - ${milestone.amount}
                            </Typography>
                            {milestone.dueDate && (
                              <Typography variant="caption" color="text.secondary">
                                Due: {new Date(milestone.dueDate).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}

                    {request.status === 'pending' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<Check />}
                          onClick={() => handleOpenDialog(request, 'accept')}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Close />}
                          onClick={() => handleOpenDialog(request, 'reject')}
                        >
                          Decline
                        </Button>
                      </Box>
                    )}

                    {request.status === 'accepted' && (
                      <Alert severity="success">
                        You accepted this request. A contract has been created.
                      </Alert>
                    )}

                    {request.status === 'rejected' && (
                      <Alert severity="info">
                        You declined this request.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Response Dialog */}
      <Dialog open={!!selectedRequest} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'accept' ? 'Accept Hire Now Request' : 'Decline Hire Now Request'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              {actionType === 'accept'
                ? 'Add an optional message to the client before accepting this request.'
                : 'Add an optional message to the client explaining why you are declining.'}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Message (Optional)"
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Type your message here..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={acceptMutation.isPending || rejectMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitResponse}
            variant="contained"
            color={actionType === 'accept' ? 'success' : 'error'}
            disabled={acceptMutation.isPending || rejectMutation.isPending}
            startIcon={
              (acceptMutation.isPending || rejectMutation.isPending) && <CircularProgress size={20} />
            }
          >
            {acceptMutation.isPending || rejectMutation.isPending
              ? 'Processing...'
              : actionType === 'accept'
              ? 'Accept'
              : 'Decline'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
