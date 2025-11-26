import React, { useState, useEffect } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Delete, Edit, ExpandMore } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/services/api';

interface WorkLogListProps {
  refreshTrigger?: number;
}

const WorkLogList: React.FC<WorkLogListProps> = ({ refreshTrigger }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editDialog, setEditDialog] = useState<any>(null);
  const [editData, setEditData] = useState({ date: '', startTime: '', endTime: '', description: '' });

  const isClient = user?.role === 'client';

  useEffect(() => {
    fetchWorkLogs();
  }, [filterStatus, refreshTrigger, page]);

  const fetchWorkLogs = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (isClient) params.groupByContract = 'true';

      const response: any = await api.get('/work-logs', { params });
      const logs = response?.data?.workLogs || [];
      setWorkLogs(Array.isArray(logs) ? logs : []);
      setGrouped(response?.data?.grouped || null);
      setTotalPages(response?.totalPages || 1);
    } catch (error: any) {
      toast.error('Failed to fetch work logs');
      setWorkLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work log?')) return;
    try {
      await api.delete(`/work-logs/${id}`);
      toast.success('Work log deleted');
      fetchWorkLogs();
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
      fetchWorkLogs();
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

  const renderLogRow = (log: any, showFreelancer = false) => (
    <TableRow key={log._id}>
      <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
      {showFreelancer && <TableCell>{getFreelancerName(log)}</TableCell>}
      {!isClient && <TableCell>{log.contract?.title || 'N/A'}</TableCell>}
      <TableCell>{log.startTime}{log.endTime && ` - ${log.endTime}`}</TableCell>
      <TableCell>{log.status === 'completed' ? formatDuration(log.duration) : '-'}</TableCell>
      <TableCell>{log.description || '-'}</TableCell>
      <TableCell>
        <Chip
          label={log.status === 'completed' ? 'Completed' : 'In Progress'}
          color={log.status === 'completed' ? 'success' : 'warning'}
          size="small"
        />
      </TableCell>
      {!isClient && (
        <TableCell>
          <IconButton size="small" onClick={() => handleEdit(log)}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleDelete(log._id)} color="error"><Delete fontSize="small" /></IconButton>
        </TableCell>
      )}
    </TableRow>
  );

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Work Logs</Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Status</InputLabel>
            <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} label="Filter Status">
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : isClient && grouped && grouped.length > 0 ? (
          <Box>
            {grouped.map((group, idx) => (
              <Accordion key={idx} defaultExpanded={idx === 0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" justifyContent="space-between" width="100%" pr={2}>
                    <Typography fontWeight="bold">{group.contract?.title || 'Unknown Contract'}</Typography>
                    <Typography color="text.secondary">{group.logs.length} logs • {group.totalHours}h total</Typography>
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
                        {group.logs.map((log: any) => renderLogRow(log, true))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : workLogs.length === 0 ? (
          <Typography color="text.secondary">No work logs found.</Typography>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    {isClient && <TableCell>Freelancer</TableCell>}
                    {!isClient && <TableCell>Contract</TableCell>}
                    <TableCell>Time</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    {!isClient && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>{workLogs.map((log) => renderLogRow(log, isClient))}</TableBody>
              </Table>
            </TableContainer>
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
              </Box>
            )}
          </>
        )}

        <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Work Log</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <TextField fullWidth type="date" label="Date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} InputLabelProps={{ shrink: true }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth type="time" label="Start Time" value={editData.startTime} onChange={(e) => setEditData({ ...editData, startTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth type="time" label="End Time" value={editData.endTime} onChange={(e) => setEditData({ ...editData, endTime: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
              <TextField fullWidth label="Description" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} multiline rows={2} />
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
