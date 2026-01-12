import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
} from '@mui/material';
import { CheckCircle, Cancel, Add } from '@mui/icons-material';
import api from '@/services/api';

const BudgetApprovalDashboard: React.FC = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [tab, setTab] = useState(0);
  const [createDialog, setCreateDialog] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [newRequest, setNewRequest] = useState({
    amount: '',
    description: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, [tab]);

  const fetchApprovals = async () => {
    try {
      const status = ['all', 'pending', 'approved', 'rejected'][tab];
      const params = status !== 'all' ? { status } : {};
      const response = await api.get('/organizations/budget-approvals', { params });
      setApprovals(response.data.data.approvals);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  };

  const handleCreateRequest = async () => {
    try {
      await api.post('/organizations/budget-approvals', {
        amount: parseFloat(newRequest.amount),
        description: newRequest.description,
      });
      alert('Budget approval request created');
      setCreateDialog(false);
      setNewRequest({ amount: '', description: '' });
      fetchApprovals();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create request');
    }
  };

  const handleReview = async (approvalId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/organizations/budget-approvals/${approvalId}/review`, {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      });
      alert(`Request ${status} successfully`);
      setReviewDialog(null);
      setRejectionReason('');
      fetchApprovals();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to review request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Budget Approvals</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialog(true)}
          >
            Request Approval
          </Button>
        </Box>

        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvals.map((approval) => (
                <TableRow key={approval._id}>
                  <TableCell>{new Date(approval.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{approval.description}</TableCell>
                  <TableCell>${approval.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    {approval.requestedBy.firstName} {approval.requestedBy.lastName}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={approval.status}
                      color={getStatusColor(approval.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {approval.status === 'pending' && (
                      <Button
                        size="small"
                        onClick={() => setReviewDialog(approval)}
                      >
                        Review
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create Request Dialog */}
        <Dialog
          open={createDialog}
          onClose={() => setCreateDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Request Budget Approval</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <TextField
                fullWidth
                type="number"
                label="Amount"
                value={newRequest.amount}
                onChange={(e) => setNewRequest({ ...newRequest, amount: e.target.value })}
                InputProps={{ startAdornment: '$' }}
                required
              />
              <TextField
                fullWidth
                label="Description"
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateRequest}>
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Review Dialog */}
        <Dialog
          open={!!reviewDialog}
          onClose={() => setReviewDialog(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Review Budget Request</DialogTitle>
          <DialogContent>
            {reviewDialog && (
              <Box display="flex" flexDirection="column" gap={2} mt={2}>
                <Typography>
                  <strong>Amount:</strong> ${reviewDialog.amount.toLocaleString()}
                </Typography>
                <Typography>
                  <strong>Description:</strong> {reviewDialog.description}
                </Typography>
                <Typography>
                  <strong>Requested By:</strong> {reviewDialog.requestedBy.firstName}{' '}
                  {reviewDialog.requestedBy.lastName}
                </Typography>
                <TextField
                  fullWidth
                  label="Rejection Reason (if rejecting)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  multiline
                  rows={2}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewDialog(null)}>Cancel</Button>
            <Button
              startIcon={<Cancel />}
              color="error"
              onClick={() => handleReview(reviewDialog._id, 'rejected')}
            >
              Reject
            </Button>
            <Button
              startIcon={<CheckCircle />}
              color="success"
              variant="contained"
              onClick={() => handleReview(reviewDialog._id, 'approved')}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BudgetApprovalDashboard;
