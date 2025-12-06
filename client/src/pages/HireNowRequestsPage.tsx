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
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Person,
  AttachMoney,
  Schedule,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { hireNowService, HireNowRequest } from '@/services/api/hireNow.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 6;

export const HireNowRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch sent hire now requests
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hire-now-sent'],
    queryFn: async () => {
      const response = await hireNowService.getSentRequests();
      console.log('[HIRE NOW PAGE] Response:', response);
      
      // Handle different response structures
      let requests = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        requests = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        requests = response.data;
      } else if (Array.isArray(response)) {
        requests = response;
      }
      
      console.log('[HIRE NOW PAGE] Parsed requests:', requests);
      return requests as HireNowRequest[];
    },
  });

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
        <ErrorState error={error} onRetry={refetch} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Hire Now Requests
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track the status of your direct hire requests to freelancers
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
          message={
            statusFilter === 'all'
              ? "You haven't sent any hire now requests yet"
              : `No ${statusFilter} requests found`
          }
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

                        {/* Freelancer Info */}
                        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                          <Avatar
                            src={request.freelancer?.profile?.avatar}
                            sx={{ width: 40, height: 40 }}
                          >
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {request.freelancer?.profile?.firstName}{' '}
                              {request.freelancer?.profile?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.freelancer?.freelancerProfile?.title || 'Freelancer'}
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
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/dashboard/freelancers/${request.freelancer?._id}`)}
                      >
                        View Freelancer
                      </Button>
                      {request.status === 'accepted' && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate('/dashboard/contracts')}
                        >
                          View Contract
                        </Button>
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
    </Container>
  );
};
