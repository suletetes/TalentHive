import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, TextField, MenuItem, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { SupportTicketCard } from './SupportTicketCard';
import { fetchTickets } from '@/store/slices/supportTicketSlice';
import { RootState, AppDispatch } from '@/store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export const SupportTicketList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { tickets, loading, error } = useSelector((state: RootState) => state.supportTicket);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const params: any = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (priorityFilter !== 'all') params.priority = priorityFilter;
    
    dispatch(fetchTickets(params));
  }, [dispatch, statusFilter, priorityFilter]);

  const handleTicketClick = (ticketId: string) => {
    navigate(`/dashboard/support/${ticketId}`);
  };

  const filteredTickets = (tickets || []).filter((ticket) =>
    searchQuery
      ? ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="in-progress">In Progress</MenuItem>
          <MenuItem value="resolved">Resolved</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
        </TextField>
        <TextField
          select
          label="Priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="all">All Priority</MenuItem>
          <MenuItem value="urgent">Urgent</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
        </TextField>
      </Box>

      {filteredTickets.length === 0 ? (
        <EmptyState message="No tickets found" />
      ) : (
        <Grid container spacing={2}>
          {filteredTickets.map((ticket) => (
            <Grid item xs={12} key={ticket._id}>
              <SupportTicketCard ticket={ticket} onClick={handleTicketClick} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
