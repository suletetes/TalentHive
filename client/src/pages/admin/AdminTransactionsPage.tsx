import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle,
  Cancel,
  Visibility,
  Download,
  FilterList,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { apiCore } from '@/services/api/core';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/ToastProvider';
import { format } from 'date-fns';

interface Transaction {
  _id: string;
  contract: any;
  milestone?: string;
  client: any;
  freelancer: any;
  amount: number;
  platformCommission: number;
  freelancerAmount: number;
  currency: string;
  status: string;
  stripePaymentIntentId?: string;
  escrowReleaseDate?: string;
  releasedAt?: string;
  refundedAt?: string;
  createdAt: string;
}

export const AdminTransactionsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: 'release' | 'refund'; tx: Transaction } | null>(null);
  const [refundReason, setRefundReason] = useState('');

  // Fetch all transactions (admin)
  const { data: transactionsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-transactions', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await apiCore.get(`/admin/transactions?${params.toString()}`);
      return response.data;
    },
    enabled: user?.role === 'admin',
  });

  // Fetch transaction stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-transaction-stats'],
    queryFn: async () => {
      const response = await apiCore.get('/admin/transactions/stats');
      return response.data;
    },
    enabled: user?.role === 'admin',
  });

  // Release payment mutation
  const releaseMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await apiCore.post(`/payments/${transactionId}/release`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment released successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transaction-stats'] });
      setActionDialog(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to release payment');
    },
  });

  // Refund payment mutation
  const refundMutation = useMutation({
    mutationFn: async ({ transactionId, reason }: { transactionId: string; reason: string }) => {
      const response = await apiCore.post(`/payments/${transactionId}/refund`, { reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment refunded successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transaction-stats'] });
      setActionDialog(null);
      setRefundReason('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to refund payment');
    },
  });

  const transactions = transactionsData?.transactions || [];
  const pagination = transactionsData?.pagination || { total: 0, pages: 1 };
  const stats = statsData || {
    totalVolume: 0,
    totalCommission: 0,
    pendingCount: 0,
    escrowCount: 0,
    releasedCount: 0,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      pending: 'warning',
      processing: 'info',
      held_in_escrow: 'info',
      released: 'success',
      refunded: 'error',
      failed: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '' });
    setPage(1);
  };

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">You do not have permission to access this page.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>Transaction Management</Typography>
          <Typography color="text.secondary">
            View and manage all platform transactions
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button startIcon={<RefreshIcon />} onClick={() => refetch()} variant="outlined">
            Refresh
          </Button>
          <Button startIcon={<Download />} variant="contained">
            Export
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Volume</Typography>
              <Typography variant="h5">${stats.totalVolume?.toLocaleString() || '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Platform Revenue</Typography>
              <Typography variant="h5" color="success.main">
                ${stats.totalCommission?.toLocaleString() || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Pending</Typography>
              <Typography variant="h5" color="warning.main">{stats.pendingCount || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">In Escrow</Typography>
              <Typography variant="h5" color="info.main">{stats.escrowCount || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Released</Typography>
              <Typography variant="h5" color="success.main">{stats.releasedCount || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              size="small"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="held_in_escrow">In Escrow</MenuItem>
              <MenuItem value="released">Released</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button onClick={clearFilters} variant="outlined" fullWidth>
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Transactions Table */}
      <Card>
        <CardContent>
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : transactions.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No transactions found
            </Typography>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Freelancer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Commission</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Escrow Release</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((tx: Transaction) => (
                      <TableRow key={tx._id}>
                        <TableCell>
                          {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {tx.client?.profile?.firstName} {tx.client?.profile?.lastName}
                        </TableCell>
                        <TableCell>
                          {tx.freelancer?.profile?.firstName} {tx.freelancer?.profile?.lastName}
                        </TableCell>
                        <TableCell>${tx.amount?.toLocaleString()}</TableCell>
                        <TableCell color="success">
                          <Typography color="success.main">
                            ${tx.platformCommission?.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={tx.status?.replace(/_/g, ' ').toUpperCase()}
                            color={getStatusColor(tx.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {tx.escrowReleaseDate
                            ? format(new Date(tx.escrowReleaseDate), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedTransaction(tx)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {tx.status === 'held_in_escrow' && (
                              <>
                                <Tooltip title="Release Payment">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => setActionDialog({ type: 'release', tx })}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Refund Payment">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setActionDialog({ type: 'refund', tx })}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={pagination.pages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog
        open={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Transaction Details</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Transaction ID</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {selectedTransaction._id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedTransaction.status?.replace(/_/g, ' ').toUpperCase()}
                    color={getStatusColor(selectedTransaction.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                  <Typography>${selectedTransaction.amount?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Platform Commission</Typography>
                  <Typography color="success.main">
                    ${selectedTransaction.platformCommission?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Freelancer Amount</Typography>
                  <Typography>${selectedTransaction.freelancerAmount?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Currency</Typography>
                  <Typography>{selectedTransaction.currency}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Stripe Payment Intent</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {selectedTransaction.stripePaymentIntentId || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography>
                    {format(new Date(selectedTransaction.createdAt), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Grid>
                {selectedTransaction.escrowReleaseDate && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Escrow Release Date</Typography>
                    <Typography>
                      {format(new Date(selectedTransaction.escrowReleaseDate), 'MMM dd, yyyy')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTransaction(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={!!actionDialog}
        onClose={() => { setActionDialog(null); setRefundReason(''); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog?.type === 'release' ? 'Release Payment' : 'Refund Payment'}
        </DialogTitle>
        <DialogContent>
          {actionDialog?.type === 'release' ? (
            <Alert severity="info">
              This will release ${actionDialog.tx.freelancerAmount?.toLocaleString()} to the freelancer's account.
            </Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This will refund ${actionDialog?.tx.amount?.toLocaleString()} to the client.
              </Alert>
              <TextField
                fullWidth
                label="Refund Reason"
                multiline
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                required
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setActionDialog(null); setRefundReason(''); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionDialog?.type === 'release' ? 'success' : 'error'}
            onClick={() => {
              if (actionDialog?.type === 'release') {
                releaseMutation.mutate(actionDialog.tx._id);
              } else if (actionDialog) {
                refundMutation.mutate({ transactionId: actionDialog.tx._id, reason: refundReason });
              }
            }}
            disabled={
              (actionDialog?.type === 'refund' && !refundReason) ||
              releaseMutation.isPending ||
              refundMutation.isPending
            }
          >
            {releaseMutation.isPending || refundMutation.isPending
              ? 'Processing...'
              : actionDialog?.type === 'release'
              ? 'Release Payment'
              : 'Refund Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
