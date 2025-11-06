import React, { useState } from 'react';
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
  CircularProgress,
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { ProposalCard } from './ProposalCard';

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

  const limit = 10;

  // Fetch proposals based on view mode
  const { data, isLoading, error } = useQuery({
    queryKey: ['proposals', projectId, viewMode, page, statusFilter, searchTerm, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const endpoint = projectId 
        ? `/proposals/project/${projectId}?${params}`
        : `/proposals/my?${params}`;

      const response = await apiService.get(endpoint);
      return response.data;
    },
  });

  const handleProposalAction = (action: string, proposalId: string) => {
    onProposalAction?.(action, proposalId);
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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load proposals. Please try again.
      </Alert>
    );
  }

  const proposals = data?.data?.proposals || [];
  const pagination = data?.data?.pagination || {};

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
      {proposals.length === 0 ? (
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
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};