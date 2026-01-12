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
  Avatar,
  Divider,
  Alert,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Person,
  AttachMoney,
  Schedule,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { hireNowService, HireNowRequest } from '@/services/api/hireNow.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 6;

export const HireNowRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<HireNowRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState('');

  const isClient = user?.role === 'client';

  // Fetch hire now requests based on user role
  const { data, isLoading, error, refetch } = useQuery<HireNowRequest[], Error>({
    queryKey: ['hire-now-requests', user?.role],
    queryFn: async () => {
      const response: any = isClient 
        ? await hireNowService.getSentRequests()
        : await hireNowService.getReceivedRequests();
      
      console.log('[HIRE NOW PAGE] Response:', response);
      
      // Handle different response structures
      let requests: HireNowRequest[] = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        requests = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        requests = response.data;
      } else if (Array.isArray(response)) {
        requests = response;
      }
      
      console.log('[HIRE NOW PAGE] Parsed requests:', requests);
      return requests;
    },
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: async ({ requestId, message }: { requestId: string; message: string }) => {
      console.log('[ACCEPT] Accepting request:', requestId, 'with message:', message);
      const response = await hireNowService.acceptRequest(requestId, message);
      console.log('[ACCEPT] Response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('[ACCEPT] Success! Contract created:', data);
      queryClient.invalidateQueries({ queryKey: ['hire-now-requests'] });
      toast.success('Request accepted! Contract created successfully.');
      setAcceptDialogOpen(false);
      setResponseMessage('');
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      console.error('[ACCEPT] Error:', error);
      toast.error(error.response?.data?.message || 'Failed to accept request');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, message }: { requestId: string; message: string }) => {
      console.log('[REJECT] Rejecting request:', requestId, 'with message:', message);
      const response = await hireNowService.rejectRequest(requestId, message);
      console.log('[REJECT] Response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('[REJECT] Success!');
      queryClient.invalidateQueries({ queryKey: ['hire-now-requests'] });
      toast.success('Request declined.');
      setRejectDialogOpen(false);
      setResponseMessage('');
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      console.error('[REJECT] Error:', error);
      toast.error(error.response?.data?.message || 'Failed to decline request');
    },
  });

  const handleAcceptClick = (request: HireNowRequest) => {
    console.log('[ACCEPT CLICK] Request:', request);
    setSelectedRequest(request);
    setAcceptDialogOpen(true);
  };

  const handleRejectClick = (request: HireNowRequest) => {
    console.log('[REJECT CLICK] Request:', request);
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const handleAcceptConfirm = () => {
    if (selectedRequest && !acceptMutation.isPending) {
      acceptMutation.mutate({
        requestId: selectedRequest._id,
        message: responseMessage,
      });
    }
  };

  const handleRejectConfirm = () => {
    if (selectedRequest && !rejectMutation.isPending) {
      rejectMutation.mutate({
        requestId: selectedRequest._id,
        message: responseMessage,
      });
    }
  };

  const requests = data || [];

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle fontSize="small" />;
      case 'rejected':
        return <Cancel fontSize="small" />;
      case 'pending':
        return <HourglassEmpty fontSize="small" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading hire now requests..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState 
          type="server"
          message={error.message || 'Failed to load hire now requests'}
          onRetry={() => refetch()} 
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isClient ? 'My Hire Now Requests' : 'Hire Now Requests'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isClient 
            ? 'Track the status of your direct hire requests to freelancers'
            : 'View and respond to direct hire requests from clients'
          }
        </Typography>
      </Box>

      {/* Status Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant={statusFilter === 'all' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => { setStatusFilter('all'); setPage(1); }}
        >
          All ({requests.length})
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'contained' : 'outlined'}
          size="small"
          color="warning"
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
        >
          Pending ({requests.filter(r => r.status === 'pending').length})
        </Button>
        <Button
          variant={statusFilter === 'accepted' ? 'contained' : 'outlined'}
          size="small"
          color="success"
          onClick={() => { setStatusFilter('accepted'); setPage(1); }}
        >
          Accepted ({requests.filter(r => r.status === 'accepted').length})
        </Button>
        <Button
          variant={statusFilter === 'rejected' ? 'contained' : 'outlined'}
          size="small"
          color="error"
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
        >
          Rejected ({requests.filter(r => r.status === 'rejected').length})
        </Button>
      </Box>

      {filteredRequests.length === 0 ? (
        <EmptyState
          title={
            statusFilter === 'all'
              ? "No hire now requests yet"
              : `No ${statusFilter} requests`
          }
          description={
            statusFilter === 'all'
              ? isClient 
                ? "You haven't sent any hire now requests yet. Browse freelancers to send direct hire requests."
                : "You haven't received any hire now requests yet."
              : `No ${statusFilter} requests found. Try adjusting your filters.`
          }
          variant="contracts"
        />
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedRequests.map((request) => (
              <Grid item xs={12} key={request._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box flex={1}>
                        <Typography variant="h6" gutterBottom>
                          {request.projectTitle}
                        </Typography>
                        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                          <Chip
                            icon={getStatusIcon(request.status)}
                            label={request.status.toUpperCase()}
                            color={getStatusColor(request.status)}
                            size="small"
                          />
                          <Chip
                            label={`Sent ${format(new Date(request.createdAt), 'MMM dd, yyyy')}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        {/* Client/Freelancer Info */}
                        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                          <Avatar
                            src={isClient ? request.freelancer?.profile?.avatar : request.client?.profile?.avatar}
                            sx={{ width: 40, height: 40 }}
                          >
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {isClient ? 'To: ' : 'From: '}
                              {isClient 
                                ? `${request.freelancer?.profile?.firstName} ${request.freelancer?.profile?.lastName}`
                                : `${request.client?.profile?.firstName} ${request.client?.profile?.lastName}`
                              }
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {isClient 
                                ? (request.freelancer?.freelancerProfile?.title || 'Freelancer')
                                : 'Client'
                              }
                            </Typography>
                          </Box>
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {request.projectDescription}
                        </Typography>

                        {/* Budget and Timeline */}
                        <Box display="flex" gap={3} mb={2}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <AttachMoney fontSize="small" color="action" />
                            <Typography variant="body2">
                              <strong>${request.budget}</strong>
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Schedule fontSize="small" color="action" />
                            <Typography variant="body2">
                              {request.timeline.duration} {request.timeline.unit}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Response Message */}
                        {request.status !== 'pending' && request.responseMessage && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Alert
                              severity={request.status === 'accepted' ? 'success' : 'error'}
                              sx={{ mb: 0 }}
                            >
                              <Typography variant="body2" fontWeight={500} gutterBottom>
                                Freelancer Response:
                              </Typography>
                              <Typography variant="body2">{request.responseMessage}</Typography>
                              {request.respondedAt && (
                                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                                  Responded on {format(new Date(request.respondedAt), 'MMM dd, yyyy')}
                                </Typography>
                              )}
                            </Alert>
                          </>
                        )}
                      </Box>
                    </Box>

                    <Box display="flex" gap={2} flexWrap="wrap">
                      {isClient ? (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              console.log('[VIEW FREELANCER] Navigating to:', `/freelancer/${request.freelancer?._id}`);
                              navigate(`/freelancer/${request.freelancer?.profileSlug || request.freelancer?._id}`);
                            }}
                          >
                            View Freelancer
                          </Button>
                          {request.status === 'accepted' && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => {
                                console.log('[VIEW CONTRACT] Navigating to contracts page');
                                navigate('/dashboard/contracts');
                              }}
                            >
                              View Contract
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              console.log('[VIEW CLIENT] Client ID:', request.client?._id);
                              console.log('[VIEW CLIENT] Full client object:', request.client);
                              // Navigate to client's public profile (clients don't have freelancer profiles)
                              // For now, show a message since clients don't have public profiles
                              toast('Client profiles are not publicly viewable', { icon: ' ' });
                            }}
                          >
                            View Client
                          </Button>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="contained"
                                size="small"
                                color="success"
                                onClick={() => handleAcceptClick(request)}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                onClick={() => handleRejectClick(request)}
                              >
                                Decline
                              </Button>
                            </>
                          )}
                          {request.status === 'accepted' && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => {
                                console.log('[VIEW CONTRACT] Navigating to contracts page');
                                navigate('/dashboard/contracts');
                              }}
                            >
                              View Contract
                            </Button>
                          )}
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
             onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Accept Dialog */}
      <Dialog open={acceptDialogOpen} onClose={() => setAcceptDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Accept Hire Now Request</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Accepting this request will create a contract and project automatically.
          </Alert>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Project:</strong> {selectedRequest.projectTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Budget:</strong> ${selectedRequest.budget}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Timeline:</strong> {selectedRequest.timeline.duration} {selectedRequest.timeline.unit}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Response Message (Optional)"
            placeholder="Add a message to the client..."
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptDialogOpen(false)} disabled={acceptMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleAcceptConfirm}
            variant="contained"
            color="success"
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? 'Accepting...' : 'Accept Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Decline Hire Now Request</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to decline this request?
          </Alert>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Project:</strong> {selectedRequest.projectTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Budget:</strong> ${selectedRequest.budget}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Response Message (Optional)"
            placeholder="Let the client know why you're declining..."
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={rejectMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleRejectConfirm}
            variant="contained"
            color="error"
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Declining...' : 'Decline Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HireNowRequestsPage;
 