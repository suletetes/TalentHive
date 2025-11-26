import React, { useState, useEffect, useMemo } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
} from '@mui/material';
import { Delete, Edit, ExpandMore, AccessTime } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import api from '@/services/api';
import { useToast } from '@/components/ui/ToastProvider';

interface WorkLogListProps {
  refreshTrigger?: number;
}

const WorkLogList: React.FC<WorkLogListProps> = ({ refreshTrigger }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editDialog, setEditDialog] = useState<any>(null);
  const [editData, setEditData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    description: '',
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchWorkLogs();
  }, [filterStatus, refreshTrigger]);

  const fetchWorkLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response: any = await api.get('/work-logs', { params });
      const logs = response?.data?.workLogs || [];
      setWorkLogs(Array.isArray(logs) ? logs : []);
      setPage(0); // Reset to first page on filter change
    } catch (error: any) {
      console.error('[WORK LOG LIST] Error fetching work logs:', error);
      toast.error('Failed to fetch work logs');
      setWorkLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Group work logs by contract for clients
  const groupedByContract = useMemo(() => {
    if (user?.role !== 'client') return null;

    const groups: Record<string, { contract: any; logs: any[]; totalMinutes: number }> = {};

    workLogs.forEach((log) => {
      const contractId = log.contract?._id || 'unknown';
      if (!groups[contractId]) {
        groups[contractId] = {
          contract: log.contract,
          logs: [],
          totalMinutes: 0,
        };
      }
      groups[contractId].logs.push(log);
      if (log.status === 'completed') {
        groups[contractId].totalMinutes += log.duration || 0;
      }
    });

    return Object.values(groups);
  }, [workLogs, user?.role]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work log?')) return;

    try {
      await api.delete(`/work-logs/${id}`);
      toast.success('Work log deleted successfully');
      fetchWorkLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete work log');
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

    // Validate end time is after start time
    if (editData.startTime && editData.endTime) {
      const [startH, startM] = editData.startTime.split(':').map(Number);
      const [endH, endM] = editData.endTime.split(':').map(Number);
      if (endH * 60 + endM <= startH * 60 + startM) {
        toast.error('End time must be after start time');
        return;
      }
    }

    try {
      await api.patch(`/work-logs/${editDialog._id}`, editData);
      toast.success('Work log updated successfully');
      setEditDialog(null);
      fetchWorkLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update work log');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'success' : 'warning';
  };

  const getFreelancerName = (log: any) => {
    const profile = log.freelancer?.profile;
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return 'Unknown';
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated logs for freelancer view
  const paginatedLogs = useMemo(() => {
    const start = page * rowsPerPage;
    return workLogs.slice(start, start + rowsPerPage);
  }, [workLogs, page, rowsPerPage]);

  const renderFreelancerView = () => (
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
            {paginatedLogs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                <TableCell>{log.contract?.title || 'N/A'}</TableCell>
                <TableCell>
                  {log.startTime}
                  {log.endTime && ` - ${log.endTime}`}
                </TableCell>
                <TableCell>
                  {log.status === 'completed' ? formatDuration(log.duration) : '-'}
                </TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.description || '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.status === 'completed' ? 'Completed' : 'In Progress'}
                    color={getStatusColor(log.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(log)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(log._id)} color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={workLogs.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </>
  );

  const renderClientView = () => (
    <Box>
      {groupedByContract?.map((group, index) => (
        <Accordion key={group.contract?._id || index} defaultExpanded={index === 0}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              width="100%"
              pr={2}
            >
              <Typography variant="subtitle1" fontWeight="medium">
                {group.contract?.title || 'Unknown Contract'}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  icon={<AccessTime />}
                  label={`${formatDuration(group.totalMinutes)} total`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip label={`${group.logs.length} entries`} size="small" variant="outlined" />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
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
                  {group.logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                      <TableCell>{getFreelancerName(log)}</TableCell>
                      <TableCell>
                        {log.startTime}
                        {log.endTime && ` - ${log.endTime}`}
                      </TableCell>
                      <TableCell>
                        {log.status === 'completed' ? formatDuration(log.duration) : '-'}
                      </TableCell>
                      <TableCell
                        sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {log.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.status === 'completed' ? 'Completed' : 'In Progress'}
                          color={getStatusColor(log.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Work Logs</Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Filter Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : workLogs.length === 0 ? (
          <Typography color="text.secondary">No work logs found.</Typography>
        ) : user?.role === 'client' ? (
          renderClientView()
        ) : (
          renderFreelancerView()
        )}

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
            <Button variant="contained" onClick={handleSaveEdit}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default WorkLogList;
