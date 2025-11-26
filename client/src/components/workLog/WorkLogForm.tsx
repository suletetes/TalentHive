import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Grid,
} from '@mui/material';
import { Check } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import api from '@/services/api';

interface WorkLogFormProps {
  contracts?: any[];
  onLogCreated?: () => void;
}

const WorkLogForm: React.FC<WorkLogFormProps> = ({ contracts = [], onLogCreated }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedContract, setSelectedContract] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeContracts = contracts.filter((c) => c.status === 'active');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!selectedContract) {
      setError('Please select a contract');
      return;
    }
    if (!date) {
      setError('Please select a date');
      return;
    }
    if (!startTime) {
      setError('Please enter start time');
      return;
    }
    if (!endTime) {
      setError('Please enter end time');
      return;
    }

    // Validate end time is after start time
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      setError('End time must be after start time');
      return;
    }

    try {
      setLoading(true);

      // api methods return response.data directly
      const createRes: any = await api.post('/work-logs', {
        contractId: selectedContract,
        date,
        startTime,
        description,
      });

      console.log('[WORK LOG] Create response:', createRes);

      // Response is already response.data, so structure is: { status, data: { workLog } }
      const workLogId = createRes?.data?.workLog?._id;

      console.log('[WORK LOG] WorkLog ID:', workLogId);

      if (!workLogId) {
        throw new Error('Failed to get work log ID from response');
      }

      // Complete it with end time
      await api.patch(`/work-logs/${workLogId}/complete`, {
        endTime,
        description,
      });

      setSuccess('Work log created successfully!');
      setStartTime('');
      setEndTime('');
      setDescription('');
      onLogCreated?.();
    } catch (err: any) {
      console.error('[WORK LOG] Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create work log');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'freelancer') {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Only freelancers can log work hours. Clients can view work logs in the list below.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Log Work Hours
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Record your work hours by selecting the date and time range
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {activeContracts.length === 0 ? (
          <Alert severity="warning">
            No active contracts found. You need an active contract to log work hours.
          </Alert>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth>
              <InputLabel>Select Contract</InputLabel>
              <Select
                value={selectedContract}
                onChange={(e) => setSelectedContract(e.target.value)}
                label="Select Contract"
              >
                {activeContracts.map((contract) => (
                  <MenuItem key={contract._id} value={contract._id}>
                    {contract.title} - {contract.project?.title || 'Project'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="date"
              label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="End Time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              placeholder="What did you work on?"
            />

            <Button
              variant="contained"
              color="primary"
              startIcon={<Check />}
              onClick={handleSubmit}
              disabled={loading || !selectedContract || !date || !startTime || !endTime}
              size="large"
            >
              {loading ? 'Saving...' : 'Save Work Log'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkLogForm;
