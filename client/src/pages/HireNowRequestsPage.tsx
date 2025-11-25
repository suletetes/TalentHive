import React, { useState, useMemo } from 'react';
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
  Avatar,
  Tabs,
  Tab,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Rating,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/ToastProvider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Check, Close, Message as MessageIcon, Work as WorkIcon, AccessTime as TimeIcon } from '@mui/icons-material';
import { format } from 'date-fns';

export const HireNowRequestsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const [tabValue, setTabValue] = useState(0); // 0 = pending, 1 = accepted, 2 = rejected
  const toast = useToast();
  const queryClient = useQueryClient();
  const limit = 10;

  // Fetch received hire now requests
  const { data: requestsData, isLoading, isError } = useQuery({
    queryKey: ['hire-now-received', page, user?._id],
    queryFn: async () => {
      console.log(`[HIRE NOW REQUESTS] Fetching for freelancer: ${user?._id}`);
      try {
        // apiService.get returns response.data directly
        const response: any = await apiService.get('/hire-now/received');
        console.log(`[HIRE NOW REQUESTS] Response:`, response);
        
        // Handle response - apiService returns response.data
        let requests = [];
        if (Array.isArray(response)) {
          requests = response;
        } else if (response?.data && Array.isArray(response.data)) {
          requests = response.data;
        } else if (response?.success && Array.isArray(response.data)) {
          requests = response.data;
        }
        
        console.log(`[HIRE NOW REQUESTS] Found ${requests.length} requests`);
        return requests;
      } catch (error) {
        console.error(`[HIRE NOW REQUESTS ERROR]`, error);
        throw error;
      }
    },
    enabled: user?.role === 'freelancer',
  });

  // Accept hire now request
  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      // apiService.put returns response.data directly
      const response = await apiService.put(`/hire-now/${id}/accept`, {
        responseMessage,
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Hire Now request accepted! Contract created.');
      queryClient.invalidateQueries({ queryKey: ['hire-now-received'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('[HIRE NOW ACCEPT ERROR]', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to accept request');
    },
  });

  // Reject hire now request
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      // apiService.put returns response.data directly
      const response = await apiService.put(`/hire-now/${id}/reject`, {
        responseMessage,
      });
      return response;
    },
    onSuccess: () => {
      toast.success('Hire Now request declined.');
      queryClient.invalidateQueries({ queryKey: ['hire-now-received'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error('[HIRE NOW REJECT ERROR]', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to decline request');
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
  
  // Filter requests by tab
  const filteredRequests = useMemo(() => {
    switch (tabValue) {
      case 0: return requests.filter((r: any) => r.status === 'pending');
      case 1: return requests.filter((r: any) => r.status === 'accepted');
      case 2: return requests.filter((r: any) => r.status === 'rejected');
      default: return requests;
    }
  }, [requests, tabValue]);

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;
  const acceptedCount = requests.filter((r: any) => r.status === 'accepted').length;
  const rejectedCount = requests.filter((r: any) => r.status === 'rejected').length;

  const totalPages = Math.ceil(filteredRequests.length / limit);
  const paginatedRequests = filteredRequests.slice((page - 1) * limit, page * limit);

  // Reset page when tab changes
  const handleTabChange = (_: any, newValue: number) => {
    setTabValue(newValue);
    setPage(1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Hire Now Requests
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Review and respond to direct hire requests from clients
      </Typography>

      {/* How It Works Section */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          How Hire Now Works
        </Typography>
        <Stepper alternativeLabel sx={{ mt: 2 }}>
          <Step completed>
            <StepLabel>Client sends request</StepLabel>
          </Step>
          <Step>
            <StepLabel>You review & respond</StepLabel>
          </Step>
          <Step>
            <StepLabel>Contract created on accept</StepLabel>
          </Step>
          <Step>
            <StepLabel>Start working</StepLabel>
          </Step>
        </Stepper>
      </Paper>

      {/* Tabs for filtering */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label={`Pending (${pendingCount})`} />
          <Tab label={`Accepted (${acceptedCount})`} />
          <Tab label={`Declined (${rejectedCount})`} />
        </Tabs>
      </Paper>

      {requests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            No hire now requests yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When clients send you direct hire requests, they will appear here.
          </Typography>
        </Box>
      ) : filteredRequests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            No {tabValue === 0 ? 'pending' : tabValue === 1 ? 'accepted' : 'declined'} requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabValue === 0 
              ? 'New hire requests from clients will appear here.'
              : tabValue === 1 
              ? 'Requests you accept will appear here with contract links.'
              : 'Requests you decline will be archived here.'}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedRequests.map((request: any) => (
              <Grid item xs={12} key={request._id}>
                <Card sx={{ 
                  borderLeft: request.status === 'pending' ? '4px solid' : 'none',
                  borderLeftColor: 'warning.main'
                }}>
                  <CardContent>
                    {/* Header with client info */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" gap={2} alignItems="center">
                        <Avatar
                          src={request.client?.profile?.avatar}
                          sx={{ width: 50, height: 50 }}
                        >
                          {request.client?.profile?.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {request.projectTitle}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" color="text.secondary">
                              {request.client?.profile?.firstName} {request.client?.profile?.lastName}
                            </Typography>
                            {request.client?.rating?.average > 0 && (
                              <>
                                <Typography variant="body2" color="text.secondary">•</Typography>
                                <Rating value={request.client?.rating?.average || 0} readOnly size="small" />
                              </>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Received {format(new Date(request.createdAt), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={request.status === 'pending' ? 'Action Required' : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        color={request.status === 'pending' ? 'warning' : request.status === 'accepted' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" paragraph sx={{ color: 'text.secondary' }}>
                      {request.projectDescription}
                    </Typography>

                    {/* Budget and Timeline Cards */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                          <Typography variant="h6" color="primary">${request.budget}</Typography>
                          <Typography variant="caption" color="text.secondary">Budget</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                          <Typography variant="h6">{request.timeline?.duration} {request.timeline?.unit}</Typography>
                          <Typography variant="caption" color="text.secondary">Timeline</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                          <Typography variant="h6">{request.milestones?.length || 0}</Typography>
                          <Typography variant="caption" color="text.secondary">Milestones</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                          <Typography variant="h6">{request.skills?.length || 0}</Typography>
                          <Typography variant="caption" color="text.secondary">Skills Required</Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {request.message && (
                      <Box sx={{ mb: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                        <Typography variant="subtitle2" color="info.main" gutterBottom>
                          💬 Message from Client
                        </Typography>
                        <Typography variant="body2">
                          {request.message}
                        </Typography>
                      </Box>
                    )}

                    {request.milestones && request.milestones.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Proposed Milestones
                        </Typography>
                        <Grid container spacing={1}>
                          {request.milestones.map((milestone: any, index: number) => (
                            <Grid item xs={12} sm={6} key={index}>
                              <Paper variant="outlined" sx={{ p: 1.5 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2" fontWeight={500}>
                                    {index + 1}. {milestone.title}
                                  </Typography>
                                  <Chip label={`$${milestone.amount}`} size="small" color="primary" variant="outlined" />
                                </Box>
                                {milestone.dueDate && (
                                  <Typography variant="caption" color="text.secondary">
                                    Due: {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                                  </Typography>
                                )}
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<Check />}
                            onClick={() => handleOpenDialog(request, 'accept')}
                            sx={{ flex: 1 }}
                          >
                            Accept & Create Contract
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Close />}
                            onClick={() => handleOpenDialog(request, 'reject')}
                          >
                            Decline
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<MessageIcon />}
                            onClick={() => navigate(`/dashboard/messages?userId=${request.client?._id}`)}
                          >
                            Message
                          </Button>
                        </>
                      )}

                      {request.status === 'accepted' && (
                        <>
                          <Button
                            variant="contained"
                            startIcon={<WorkIcon />}
                            onClick={() => navigate('/dashboard/contracts')}
                          >
                            View Contract
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<MessageIcon />}
                            onClick={() => navigate(`/dashboard/messages?userId=${request.client?._id}`)}
                          >
                            Message Client
                          </Button>
                        </>
                      )}

                      {request.status === 'rejected' && (
                        <Typography variant="body2" color="text.secondary">
                          You declined this request on {format(new Date(request.updatedAt || request.createdAt), 'MMM d, yyyy')}
                        </Typography>
                      )}
                    </Box>
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
