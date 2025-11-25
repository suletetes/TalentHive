import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  Pagination,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { paymentsService, Transaction } from '@/services/api/payments.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

export const PaymentsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Fetch transaction history
  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await paymentsService.getTransactionHistory({
        page: 1,
        limit: 50,
      });
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'released':
        return 'success';
      case 'held_in_escrow':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'default';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  if (transactionsLoading) {
    return <LoadingSpinner message="Loading payment information..." />;
  }

  if (transactionsError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={transactionsError} onRetry={refetchTransactions} />
      </Container>
    );
  }

  const transactions = Array.isArray(transactionsData) ? transactionsData : (transactionsData?.transactions || []);
  
  // Pagination
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return transactions.slice(start, start + ITEMS_PER_PAGE);
  }, [transactions, page]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Transactions
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track all your financial transactions and payments
      </Typography>

      <Grid container spacing={3}>
        {/* Transaction Summary Cards */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Transactions
              </Typography>
              <Typography variant="h3" color="primary" gutterBottom>
                {transactions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All-time transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h3" color="primary" gutterBottom>
                ${transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Combined transaction value
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Transaction History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction History
              </Typography>
              {transactions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No transactions yet
                </Typography>
              ) : (
                <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Commission</TableCell>
                        <TableCell>Freelancer Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Escrow Release</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTransactions.map((transaction: Transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell>
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              ${transaction.amount.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              ${transaction.platformCommission.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={user?.role === 'freelancer' ? 'success.main' : 'text.primary'}
                              fontWeight="medium"
                            >
                              ${transaction.freelancerAmount.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.status.replace(/_/g, ' ').toUpperCase()}
                              color={getStatusColor(transaction.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {transaction.escrowReleaseDate
                              ? format(new Date(transaction.escrowReleaseDate), 'MMM dd, yyyy')
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Showing {paginatedTransactions.length} of {transactions.length} transactions
                </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
