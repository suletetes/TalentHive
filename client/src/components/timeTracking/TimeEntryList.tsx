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
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Edit,
  Send,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import api from '@/services/api';

const TimeEntryList: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTimeEntries();
  }, [filterStatus]);

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      const response = await api.get('/time-tracking/entries', { params });
      console.log('✅ TimeEntryList response:', response.data);
      const timeEntries = response.data?.data?.timeEntries || response.data?.data || [];
      setEntries(Array.isArray(timeEntries) ? timeEntries : []);
    } catch (error: any) {
      console.error('❌ Error fetching time entries:', error.response?.status, error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEntries = async () => {
    if (selectedEntries.length === 0) {
      alert('Please select entries to submit');
      return;
    }

    try {
      await api.post('/time-tracking/entries/submit', {
        entryIds: selectedEntries,
      });
      alert('Time entries submitted successfully');
      setSelectedEntries([]);
      fetchTimeEntries();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit entries');
    }
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewDialog) return;

    try {
      await api.patch(`/time-tracking/entries/${reviewDialog._id}/review`, {
        status,
        reviewNotes,
      });
      alert(`Time entry ${status} successfully`);
      setReviewDialog(null);
      setReviewNotes('');
      fetchTimeEntries();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to review entry');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'submitted':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Time Entries</Typography>
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Filter Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="stopped">Stopped</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            {user?.role === 'freelancer' && selectedEntries.length > 0 && (
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={handleSubmitEntries}
              >
                Submit Selected ({selectedEntries.length})
              </Button>
            )}
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {user?.role === 'freelancer' && <TableCell padding="checkbox" />}
                <TableCell>Date</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry._id}>
                  {user?.role === 'freelancer' && (
                    <TableCell padding="checkbox">
                      {entry.status === 'stopped' && (
                        <input
                          type="checkbox"
                          checked={selectedEntries.includes(entry._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEntries([...selectedEntries, entry._id]);
                            } else {
                              setSelectedEntries(selectedEntries.filter(id => id !== entry._id));
                            }
                          }}
                        />
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    {new Date(entry.startTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{entry.project?.title}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{formatDuration(entry.duration)}</TableCell>
                  <TableCell>
                    ${entry.billableAmount?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.status}
                      color={getStatusColor(entry.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user?.role === 'client' && entry.status === 'submitted' && (
                      <IconButton
                        size="small"
                        onClick={() => setReviewDialog(entry)}
                      >
                        <Edit />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Review Dialog */}
        <Dialog
          open={!!reviewDialog}
          onClose={() => setReviewDialog(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Review Time Entry</DialogTitle>
          <DialogContent>
            {reviewDialog && (
              <Box display="flex" flexDirection="column" gap={2} mt={2}>
                <Typography>
                  <strong>Description:</strong> {reviewDialog.description}
                </Typography>
                <Typography>
                  <strong>Duration:</strong> {formatDuration(reviewDialog.duration)}
                </Typography>
                <Typography>
                  <strong>Amount:</strong> ${reviewDialog.billableAmount?.toFixed(2)}
                </Typography>
                <TextField
                  fullWidth
                  label="Review Notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  multiline
                  rows={3}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewDialog(null)}>Cancel</Button>
            <Button
              startIcon={<Cancel />}
              color="error"
              onClick={() => handleReview('rejected')}
            >
              Reject
            </Button>
            <Button
              startIcon={<CheckCircle />}
              color="success"
              variant="contained"
              onClick={() => handleReview('approved')}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TimeEntryList;
