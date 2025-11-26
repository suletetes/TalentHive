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
  FormHelperText,
} from '@mui/material';
import { Check } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/services/api';

interface WorkLogFormProps {
  contracts?: any[];
  onLogCreated?: () => void;
}

interface FormErrors {
  contract?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

const WorkLogForm: React.FC<WorkLogFormProps> = ({ contracts = [], onLogCreated }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();
  const [selectedContract, setSelectedContract] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const activeContracts = contracts.filter((c) => c.status === 'active');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedContract) {
      newErrors.contract = 'Please select a contract';
    }
    if (!date) {
      newErrors.date = 'Please select a date';
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future';
      }
    }
    if (!startTime) {
      newErrors.startTime = 'Please enter start time';
    }
    if (!endTime) {
      newErrors.endTime = 'Please enter end time';
    }
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (endMinutes <= startMinutes) {
        newErrors.endTime = 'End time must be after start time';
      }
      const duration = endMinutes - startMinutes;
      if (duration > 12 * 60) {
        newErrors.endTime = 'Work session cannot exceed 12 hours';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    try {
      setLoading(true);
      const createRes: any = await api.post('/work-logs', {
        contractId: selectedContract,
        date,
        startTime,
        description,
      });
      const workLogId = createRes?.data?.workLog?._id;
      if (!workLogId) throw new Error('Failed to create work log');

      await api.patch(`/work-logs/${workLogId}/complete`, { endTime, description });
      toast.success('Work log saved successfully!');
      setStartTime('');
      setEndTime('');
      setDescription('');
      setErrors({});
      onLogCreated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create work log');
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
        <Typography variant="h6" gutterBottom>Log Work Hours</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Record your work hours by selecting the date and time range
        </Typography>

        {activeContracts.length === 0 ? (
          <Alert severity="warning">
            No active contracts found. You need an active contract to log work hours.
          </Alert>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth error={!!errors.contract}>
              <InputLabel>Select Contract</InputLabel>
              <Select
                value={selectedContract}
                onChange={(e) => { setSelectedContract(e.target.value); setErrors({ ...errors, contract: undefined }); }}
                label="Select Contract"
              >
                {activeContracts.map((contract) => (
                  <MenuItem key={contract._id} value={contract._id}>
                    {contract.title} - {contract.project?.title || 'Project'}
                  </MenuItem>
                ))}
              </Select>
              {errors.contract && <FormHelperText>{errors.contract}</FormHelperText>}
            </FormControl>

            <TextField
              fullWidth
              type="date"
              label="Date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setErrors({ ...errors, date: undefined }); }}
              InputLabelProps={{ shrink: true }}
              error={!!errors.date}
              helperText={errors.date}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Time"
                  value={startTime}
                  onChange={(e) => { setStartTime(e.target.value); setErrors({ ...errors, startTime: undefined }); }}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.startTime}
                  helperText={errors.startTime}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="End Time"
                  value={endTime}
                  onChange={(e) => { setEndTime(e.target.value); setErrors({ ...errors, endTime: undefined }); }}
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.endTime}
                  helperText={errors.endTime}
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
              disabled={loading}
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
