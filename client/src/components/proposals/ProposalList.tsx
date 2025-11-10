import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Grid,
  Pagination,
  Alert,
  Button,
} from '@mui/material';
import { Search, FilterList, Refresh } from '@mui/icons-material';
import { ProposalCard } from './ProposalCard';
import { useProposals, useAcceptProposal, useRejectProposal } from '@/hooks/api/useProposals';
import { useSocket } from '@/hooks/useSocket';
import { ListSkeleton } from '@/components/ui/LoadingStates';
import { ErrorHandler } from '@/utils/errorHandler';
import { useToast } from '@/components/ui/ToastProvider';

interface ProposalListProps {
  projectId?: string;
  viewMode: 'freelancer' | 'client';
  onProposalAction?: (action: string, proposalId: string) => void;
}

export const ProposalList: React.FC<ProposalListProps> = ({
  projectId,
  viewMode,
  onProposalAction,
}) => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const toast = useToast();
  const socket = useSocket();

  const limit = 10;

  // Fetch proposals based on view mode
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProposals({
    projectId,
    page,
    limit,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchTerm || undefined,
    sortBy,
    sortOrder,
  });

  // Accept proposal mutation
  const acceptMutation = useAcceptProposal({
    onSuccess: () => {
      toast.success('Proposal accepted successfully!');
      refetch();
    },
    onError: (error) => {
      ErrorHandler.handleAndShow(error);
    },
  });

  // Reject proposal mutation
  const rejectMutation = useRejectProposal({
    onSuccess: () => {
      toast.success('Proposal rejected');
      refetch();
    },
    onError: (error) => {
      ErrorHandler.handleAndShow(error);
    },
  });

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleProposalUpdate = (data: any) => {
      // Refetch proposals when there's an update
      if (projectId && data.projectId === projectId) {
        refetch();
      } else if (!projectId) {
        refetch();
      }
    };

    socket.on('proposal:updated', handleProposalUpdate);
    socket.on('proposal:created', handleProposalUpdate);
    socket.on('proposal:status-changed', handleProposalUpdate);

    return () => {
      socket.off('proposal:updated', handleProposalUpdate);
      socket.off('proposal:created', handleProposalUpdate);
      socket.off('proposal:status-changed', handleProposalUpdate);
    };
  }, [socket, projectId, refetch]);

  const handleProposalAction = (action: string, proposalId: string) => {
    switch (action) {
      case 'accept':
        acceptMutation.mutate(proposalId);
        break;
      case 'reject':
        rejectMutation.mutate(proposalId);
        break;
      default:
        onProposalAction?.(action, proposalId);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const getStatusOptions = () => {
    if (viewMode === 'client') {
      return [
        { value: 'all', label: 'All Proposals' },
        { value: 'submitted', label: 'Under Review' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'rejected', label: 'Rejected' },
      ];
    } else {
      return [
        { value: 'all', label: 'All Proposals' },
        { value: 'draft', label: 'Drafts' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'withdrawn', label: 'Withdrawn' },
      ];
    }
  };

  const getSortOptions = () => [
    { value: 'submittedAt', label: 'Date Submitted' },
    { value: 'bidAmount', label: 'Bid Amount' },
    { value: 'timeline.duration', label: 'Timeline' },
    ...(viewMode === 'client' ? [{ value: 'freelancer.rating', label: 'Freelancer Rating' }] : []),
  ];

  if (isLoading) {
    return <ListSkeleton items={5} height={150} />;
  }

  if (isError) {
    const apiError = ErrorHandler.handle(error);
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" startIcon={<Refresh />} onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        <Typography variant="subtitle2" gutterBottom>
          Failed to load proposals
        </Typography>
        <Typography variant="body2">{apiError.message}</Typography>
      </Alert>
    );
  }

  const proposals = data?.proposals || [];
  const pagination = data?.pagination || {};

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {viewMode === 'client' ? 'Project Proposals' : 'My Proposals'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pagination.total || 0} proposal{pagination.total !== 1 ? 's' : ''} found
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search proposals..."
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
              {getStatusOptions().map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              {getSortOptions().map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              label="Order"
            >
              <MenuItem value="desc">Newest First</MenuItem>
              <MenuItem value="asc">Oldest First</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Proposals List */}
      {isFetching && !isLoading ? (
        <ListSkeleton items={3} height={150} />
      ) : proposals.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <FilterList sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No proposals found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {viewMode === 'client' 
              ? 'No proposals have been submitted for this project yet.'
              : 'You haven\'t submitted any proposals yet. Start browsing projects to find opportunities!'
            }
          </Typography>
        </Box>
      ) : (
        <>
          {proposals.map((proposal: any) => (
            <ProposalCard
              key={proposal._id}
              proposal={proposal}
              viewMode={viewMode}
              onEdit={(id) => handleProposalAction('edit', id)}
              onWithdraw={(id) => handleProposalAction('withdraw', id)}
              onAccept={(id) => handleProposalAction('accept', id)}
              onReject={(id) => handleProposalAction('reject', id)}
              onView={(id) => handleProposalAction('view', id)}
              isProcessing={acceptMutation.isPending || rejectMutation.isPending}
            />
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
                disabled={isFetching}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};