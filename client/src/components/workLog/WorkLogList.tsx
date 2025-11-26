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
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import api from '@/services/api';

interface WorkLogListProps {
  refreshTrigger?: number;
}

const WorkLogList: React.FC<WorkLogListProps> = ({ refreshTrigger }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editDialog, setEditDialog] = useState<any>(null);
  const [editData, setEditData] = useState({ date: '', startTime: '', endTime: '', description: '' });

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
      console.log('[WORK LOG LIST] Fetching work logs with params:', params);
      
      // api.get returns response.data directly
      const response: any = await api.get('/work-logs', { params });
      console.log('[WORK LOG LIST] Response:', response);

      // Response structure is: { status, results, data: { workLogs } }
      const logs = response?.data?.workLogs || [];
      console.log('[WORK LOG LIST] Extracted logs:', logs);
      
      setWorkLogs(Array.isArray(logs) ? logs : []);
    } catch (error: any) {
      console.error('[WORK LOG LIST] Error fetching work logs:', error);
      setWorkLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work log?')) return;

    try {
      await api.delete(`/work-logs/${id}`);
      fetchWorkLogs();
    } catch (error: any) {
      alert(error.message || 'Failed to delete work log');
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
      setEditDialog(null);
      fetchWorkLogs();
    } catch (error: any) {
      alert(error.message || 'Failed to update work log');
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
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  {user?.role === 'client' && <TableCell>Freelancer</TableCell>}
                  <TableCell>Contract</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  {user?.role === 'freelancer' && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {workLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                    {user?.role === 'client' && <TableCell>{getFreelancerName(log)}</TableCell>}
                    <TableCell>{log.contract?.title || 'N/A'}</TableCell>
                    <TableCell>
                      {log.startTime}
                      {log.endTime && ` - ${log.endTime}`}
                    </TableCell>
                    <TableCell>
                      {log.status === 'completed' ? formatDuration(log.duration) : '-'}
                    </TableCell>
                    <TableCell>{log.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.status === 'completed' ? 'Completed' : 'In Progress'}
                        color={getStatusColor(log.status)}
                        size="small"
                      />
                    </TableCell>
                    {user?.role === 'freelancer' && (
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEdit(log)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(log._id)} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
