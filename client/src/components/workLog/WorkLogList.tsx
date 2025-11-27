import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Pagination,
  Paper,
  Collapse,
  CircularProgress,
} from '@mui/material';
import { Delete, Edit, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RootState } from '@/store';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/services/api';

interface WorkLogListProps {
  refreshTrigger?: number;
}

const WorkLogList: React.FC<WorkLogListProps> = ({ refreshTrigger }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [editDialog, setEditDialog] = useState<any>(null);
  const [editData, setEditData] = useState({ date: '', startTime: '', endTime: '', description: '' });

  const isClient = user?.role === 'client';
  const ITEMS_PER_PAGE = 10;

  // Fetch all work logs
  const { data, isLoading } = useQuery({
    queryKey: ['work-logs', filterStatus, refreshTrigger],
    queryFn: async () => {
      const params: any = { limit: 500 }; // Get all for client-side pagination
      if (filterStatus !== 'all') params.status = filterStatus;
      if (isClient) params.groupByContract = 'true';

      const response: any = await api.get('/work-logs', { params });
      console.log('[WORK LOG LIST] Response:', response);
      return {
        workLogs: response?.data?.workLogs || [],
        grouped: response?.data?.grouped || null,
        total: response?.total || 0,
      };
    },
    staleTime: 30000,
    gcTime: 60000,
  });

  const workLogs = data?.workLogs || [];
  const grouped = data?.grouped || null;

  // Paginate work logs for freelancer view
  const paginatedLogs = useMemo(() => {
    if (isClient) return [];
    const start = (page - 1) * ITEMS_PER_PAGE;
    return workLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [workLogs, page, isClient]);

  const totalPages = Math.ceil(workLogs.length / ITEMS_PER_PAGE);

  // For client: paginate grouped contracts
  const paginatedGroups = useMemo(() => {
    if (!isClient || !grouped) return [];
    const start = (page - 1) * ITEMS_PER_PAGE;
    return grouped.slice(start, start + ITEMS_PER_PAGE);
  }, [grouped, page, isClient]);

  const totalGroupPages = grouped ? Math.ceil(grouped.length / ITEMS_PER_PAGE) : 1;

  const toggleContract = (contractId: string) => {
    setExpandedContracts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contractId)) {
        newSet.delete(contractId);
      } else {
        newSet.add(contractId);
      }
      return newSet;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work log?')) return;
    try {
      await api.delete(`/work-logs/${id}`);
      toast.success('Work log deleted');
      queryClient.invalidateQueries({ queryKey: ['work-logs'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete work log');
    }
  };

  const handleEdit = (log: any) => {
    setEditDialog(log);
    setEditData({
      date: new Date(log.date).toISOString().split('T')[0],
      startTime: log.startTime,
      endTime: log.endTime || '',
      description: log.description || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editDialog) return;
    try {
      await api.patch(`/work-logs/${editDialog._id}`, editData);
      toast.success('Work log updated');
      setEditDialog(null);
      queryClient.invalidateQueries({ queryKey: ['work-logs'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update work log');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getFreelancerName = (log: any) => {
    const profile = log.freelancer?.profile;
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return 'Unknown';
  };

  // Render for client - grouped by contract
  const renderClientView = () => {
    if (!grouped || grouped.length === 0) {
      return <Typography color="text.secondary" textAlign="center" py={4}>No work logs found.</Typography>;
    }

    return (
      <>
        {paginatedGroups.map((group: any) => {
          const contractId = group.contract?._id || 'unknown';
          const isExpanded = expandedContracts.has(contractId);

          return (
            <Paper key={contractId} sx={{ mb: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
                onClick={() => toggleContract(contractId)}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {group.contract?.title || 'Unknown Contract'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {group.logs.length} work logs • {group.totalHours} hours total
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip label={`${group.totalHours}h`} color="primary" size="small" />
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </Box>
              </Box>

              <Collapse in={isExpanded}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Freelancer</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.logs.map((log: any) => (
                        <TableRow key={log._id}>
                          <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                          <TableCell>{getFreelancerName(log)}</TableCell>
                          <TableCell>{log.startTime}{log.endTime && ` - ${log.endTime}`}</TableCell>
                          <TableCell>{log.status === 'completed' ? formatDuration(log.duration) : '-'}</TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.status === 'completed' ? 'Completed' : 'In Progress'}
                              color={log.status === 'completed' ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Paper>
          );
        })}

        {totalGroupPages > 1 && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={totalGroupPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
            />
          </Box>
        )}
      </>
    );
  };

  // Render for freelancer - flat list
  const renderFreelancerView = () => {
    if (workLogs.length === 0) {
      return <Typography color="text.secondary" textAlign="center" py={4}>No work logs found.</Typography>;
    }

    return (
      <>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Contract</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.map((log: any) => (
                <TableRow key={log._id}>
                  <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                  <TableCell>{log.contract?.title || 'N/A'}</TableCell>
                  <TableCell>{log.startTime}{log.endTime && ` - ${log.endTime}`}</TableCell>
                  <TableCell>{log.status === 'completed' ? formatDuration(log.duration) : '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.status === 'completed' ? 'Completed' : 'In Progress'}
                      color={log.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEdit(log)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(log._id)} color="error"><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            Work Logs {data?.total ? `(${data.total})` : ''}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              label="Filter Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : isClient ? renderClientView() : renderFreelancerView()}

        {/* Edit Dialog */}
        <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Work Log</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={editData.date}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Start Time"
                    value={editData.startTime}
                    onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="End Time"
                    value={editData.endTime}
                    onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit}>Save</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default WorkLogList;
