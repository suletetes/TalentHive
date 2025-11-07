import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Pagination,
  Alert,
  CircularProgress,
  Button,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search,
  FilterList,
  AttachMoney,
  Schedule,
  Receipt,
  Download,
  MoreVert,
  Visibility,
  Refresh,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

interface PaymentHistoryProps {
  userRole?: 'client' | 'freelancer';
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ userRole }) => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const limit = 10;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payments', 'history', page, statusFilter, typeFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await apiService.get(`/payments/history?${params}`);
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone_payment':
        return <AttachMoney />;
      case 'bonus':
        return <AttachMoney />;
      case 'refund':
        return <Refresh />;
      case 'withdrawal':
        return <Download />;
      default:
        return <Receipt />;
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, payment: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPayment(null);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const downloadReceipt = (paymentId: string) => {
    // Implementation for downloading receipt
    window.open(`/api/payments/${paymentId}/receipt`, '_blank');
    handleMenuClose();
  };

  const viewDetails = (paymentId: string) => {
    // Implementation for viewing payment details
    console.log('View details for payment:', paymentId);
    handleMenuClose();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load payment history. Please try again.
      </Alert>
    );
  }

  const payments = data?.data?.payments || [];
  const pagination = data?.data?.pagination || {};

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Payment History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pagination.total || 0} payment{pagination.total !== 1 ? 's' : ''} found
        </Typography>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              label="Type"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="milestone_payment">Milestone Payments</MenuItem>
              <MenuItem value="bonus">Bonuses</MenuItem>
              <MenuItem value="refund">Refunds</MenuItem>
              <MenuItem value="withdrawal">Withdrawals</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Grid>
      </Grid>

      {/* Payments List */}
      {payments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Receipt sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No payments found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userRole === 'client' 
              ? 'You haven\'t made any payments yet.'
              : 'You haven\'t received any payments yet.'
            }
          </Typography>
        </Box>
      ) : (
        <>
          {payments.map((payment: any) => (
            <Card key={payment._id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getTypeIcon(payment.type)}
                    <Box>
                      <Typography variant="h6">
                        {payment.metadata?.description || 'Payment'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {payment.contract?.title || 'No contract'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={payment.status.toUpperCase()}
                      color={getStatusColor(payment.status) as any}
                      size="small"
                    />
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, payment)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography variant="h6">
                      ${payment.amount.toFixed(2)} {payment.currency}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Platform Fee
                    </Typography>
                    <Typography variant="body2">
                      ${payment.platformFee.toFixed(2)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Net Amount
                    </Typography>
                    <Typography variant="body2">
                      ${payment.freelancerAmount.toFixed(2)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Payment Participants */}
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    From: {payment.client?.profile?.firstName} {payment.client?.profile?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    To: {payment.freelancer?.profile?.firstName} {payment.freelancer?.profile?.lastName}
                  </Typography>
                </Box>

                {/* Escrow Release Date */}
                {payment.escrowReleaseDate && payment.status === 'completed' && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <Schedule sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      Escrow release: {format(new Date(payment.escrowReleaseDate), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                )}

                {/* Notes */}
                {payment.metadata?.clientNotes && (
                  <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Notes: {payment.metadata.clientNotes}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.pages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => viewDetails(selectedPayment?._id)}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        {selectedPayment?.status === 'completed' && (
          <MenuItem onClick={() => downloadReceipt(selectedPayment._id)}>
            <ListItemIcon>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download Receipt</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};