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
  Alert,
} from '@mui/material';
import { Delete, Edit, ExpandMore, ExpandLess, CheckCircle } from '@mui/icons-material';
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
  const [completeDialog, setCompleteDialog] = useState<any>(null);
  const [editData, setEditData] = useState({ startDate: '', startTime: '', endDate: '', endTime: '', description: '' });
  const [completeData, setCompleteData] = useState({ endDate: '', endTime: '' });

  const isClient = user?.role === 'client';
  const ITEMS_PER_PAGE = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['work-logs', filterStatus, refreshTrigger],
    queryFn: async () => {
      const params: any = { limit: 500 };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (isClient) params.groupByContract = 'true';
      const response: any = await api.get('/work-logs', { params });
      console.log('[WORK LOG LIST] Full response:', response);
      // api.get returns response.data directly, so response = { status, results, total, data: { workLogs, grouped } }
      return {
        workLogs: response?.data?.workLogs || [],
        grouped: response?.data?.grouped || null,
        total: response?.total || 0,
      };
    },
    staleTime: 30000,
  });

  const workLogs = data?.workLogs || [];
  const grouped = data?.grouped || null;

  const paginatedLogs = useMemo(() => {
    if (isClient) return [];
    const start = (page - 1) * ITEMS_PER_PAGE;
    return workLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [workLogs, page, isClient]);

  const totalPages = Math.ceil(workLogs.length / ITEMS_PER_PAGE);
  const paginatedGroups = useMemo(() => {
    if (!isClient || !grouped) return [];
    const start = (page - 1) * ITEMS_PER_PAGE;
    return grouped.slice(start, start + ITEMS_PER_PAGE);
  }, [grouped, page, isClient]);
  const totalGroupPages = grouped ? Math.ceil(grouped.length / ITEMS_PER_PAGE) : 1;

  // Count in-progress sessions
  const inProgressCount = workLogs.filter((l: any) => l.status === 'in_progress').length;

  const toggleContract = (contractId: string) => {
    setExpandedContracts((prev) => {
      const newSet = new Set(prev);
      newSet.has(contractId) ? newSet.delete(contractId) : newSet.add(contractId);
      return newSet;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this work log?')) return;
    try {
      await api.delete(`/work-logs/${id}`);
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['work-logs'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleEdit = (log: any) => {
    setEditDialog(log);
    setEditData({
      startDate: log.startDate ? new Date(log.startDate).toISOString().split('T')[0] : '',
      startTime: log.startTime || '',
      endDate: log.endDate ? new Date(log.endDate).toISOString().split('T')[0] : '',
      endTime: log.endTime || '',
      description: log.description || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editDialog) return;
    try {
      await api.patch(`/work-logs/${editDialog._id}`, editData);
      toast.success('Updated');
      setEditDialog(null);
      queryClient.invalidateQueries({ queryKey: ['work-logs'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  const handleComplete = (log: any) => {
    setCompleteDialog(log);
    const now = new Date();
    setCompleteData({
      endDate: now.toISOString().split('T')[0],
      endTime: now.toTimeString().slice(0, 5),
    });
  };

  const handleSaveComplete = async () => {
    if (!completeDialog || !completeData.endDate || !completeData.endTime) {
      toast.error('Please enter end date and time');
      return;
    }
    try {
      await api.patch(`/work-logs/${completeDialog._id}/complete`, completeData);
      toast.success('Work session completed!');
      setCompleteDialog(null);
      queryClient.invalidateQueries({ queryKey: ['work-logs'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete');
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '-';
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const formatDateRange = (log: any) => {
    const start = log.startDate ? new Date(log.startDate).toLocaleDateString() : '';
    const end = log.endDate ? new Date(log.endDate).toLocaleDateString() : '';
    if (start === end || !end) return start;
    return `${start} → ${end}`;
  };

  const getFreelancerName = (log: any) => {
    const p = log.freelancer?.profile;
    return p?.firstName || p?.lastName ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : 'Unknown';
  };

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
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }} onClick={() => toggleContract(contractId)}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">{group.contract?.title || 'Unknown'}</Typography>
                  <Typography variant="body2" color="text.secondary">{group.logs.length} logs • {group.totalHours}h total</Typography>
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
                          <TableCell>{formatDateRange(log)}</TableCell>
                          <TableCell>{getFreelancerName(log)}</TableCell>
                          <TableCell>{log.startTime}{log.endTime && ` - ${log.endTime}`}</TableCell>
                          <TableCell>{formatDuration(log.duration)}</TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.description || '-'}</TableCell>
                          <TableCell><Chip label={log.status === 'completed' ? 'Completed' : 'In Progress'} color={log.status === 'completed' ? 'success' : 'warning'} size="small" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Paper>
          );
        })}
        {totalGroupPages > 1 && <Box display="flex" justifyContent="center" mt={3}><Pagination count={totalGroupPages} page={page} onChange={(_, p) => setPage(p)} color="primary" /></Box>}
      </>
    );
  };

  const renderFreelancerView = () => {
    if (workLogs.length === 0) {
      return <Typography color="text.secondary" textAlign="center" py={4}>No work logs found.</Typography>;
    }
    return (
      <>
        {inProgressCount > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You have {inProgressCount} work session(s) in progress. Click "Complete" to finish them.
          </Alert>
        )}
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
                <TableRow key={log._id} sx={log.status === 'in_progress' ? { bgcolor: 'warning.light' } : {}}>
                  <TableCell>{formatDateRange(log)}</TableCell>
                  <TableCell>{log.contract?.title || 'N/A'}</TableCell>
                  <TableCell>{log.startTime}{log.endTime && ` - ${log.endTime}`}</TableCell>
                  <TableCell>{formatDuration(log.duration)}</TableCell>
                  <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.description || '-'}</TableCell>
                  <TableCell><Chip label={log.status === 'completed' ? 'Completed' : 'In Progress'} color={log.status === 'completed' ? 'success' : 'warning'} size="small" /></TableCell>
                  <TableCell>
                    {log.status === 'in_progress' && (
                      <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleComplete(log)} sx={{ mr: 1 }}>
                        Complete
                      </Button>
                    )}
                    <IconButton size="small" onClick={() => handleEdit(log)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(log._id)} color="error"><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && <Box display="flex" justifyContent="center" mt={3}><Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" /></Box>}
      </>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Work Logs {data?.total ? `(${data.total})` : ''}</Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter</InputLabel>
            <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} label="Filter">
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {isLoading ? <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box> : isClient ? renderClientView() : renderFreelancerView()}

        {/* Edit Dialog */}
        <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Work Log</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField fullWidth type="date" label="Start Date" value={editData.startDate} onChange={(e) => setEditData({ ...editData, startDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TextField fullWidth type="time" label="Start Time" value={editData.startTime} onChange={(e) => setEditData({ ...editData, startTime: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField fullWidth type="date" label="End Date" value={editData.endDate} onChange={(e) => setEditData({ ...editData, endDate: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TextField fullWidth type="time" label="End Time" value={editData.endTime} onChange={(e) => setEditData({ ...editData, endTime: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
              </Grid>
              <TextField fullWidth label="Description" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} multiline rows={2} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit}>Save</Button>
          </DialogActions>
        </Dialog>

        {/* Complete Dialog */}
        <Dialog open={!!completeDialog} onClose={() => setCompleteDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Complete Work Session</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Started: {completeDialog?.startDate && new Date(completeDialog.startDate).toLocaleDateString()} at {completeDialog?.startTime}
            </Alert>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField fullWidth type="date" label="End Date" value={completeData.endDate} onChange={(e) => setCompleteData({ ...completeData, endDate: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth type="time" label="End Time" value={completeData.endTime} onChange={(e) => setCompleteData({ ...completeData, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompleteDialog(null)}>Cancel</Button>
            <Button variant="contained" color="success" onClick={handleSaveComplete}>Complete</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default WorkLogList;
