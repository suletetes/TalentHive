import React, { useState, useMemo } from 'react';
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
  Divider,
  Chip,
} from '@mui/material';
import { PlayArrow, Check } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/services/api';

interface WorkLogFormProps {
  contracts?: any[];
  onLogCreated?: () => void;
}

const isContractFullySigned = (contract: any): boolean => {
  const signatures = contract.signatures || [];
  if (signatures.length < 2) return false;
  const clientId = typeof contract.client === 'string' ? contract.client : contract.client?._id;
  const freelancerId = typeof contract.freelancer === 'string' ? contract.freelancer : contract.freelancer?._id;
  const clientSigned = signatures.some((s: any) => s.signedBy === clientId || s.signedBy?._id === clientId);
  const freelancerSigned = signatures.some((s: any) => s.signedBy === freelancerId || s.signedBy?._id === freelancerId);
  return clientSigned && freelancerSigned;
};

const WorkLogForm: React.FC<WorkLogFormProps> = ({ contracts = [], onLogCreated }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const toast = useToast();
  
  // Form state
  const [selectedContract, setSelectedContract] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Mode: 'start' = start new session, 'complete' = log with start and end
  const [mode, setMode] = useState<'start' | 'complete'>('complete');

  const eligibleContracts = useMemo(() => {
    return contracts.filter((c) => c.status === 'active' && isContractFullySigned(c));
  }, [contracts]);

  const selectedContractData = contracts.find((c) => c._id === selectedContract);
  const milestones = selectedContractData?.milestones || [];
  const activeMilestones = milestones.filter((m: any) => 
    ['pending', 'in_progress', 'submitted'].includes(m.status)
  );

  const handleContractChange = (contractId: string) => {
    setSelectedContract(contractId);
    setSelectedMilestone('');
  };

  const handleStartSession = async () => {
    if (!selectedContract || !startDate || !startTime) {
      toast.error('Please fill in contract, date, and start time');
      return;
    }

    try {
      setLoading(true);
      await api.post('/work-logs', {
        contractId: selectedContract,
        milestoneId: selectedMilestone || undefined,
        startDate,
        startTime,
        description,
      });
      toast.success('Work session started! Complete it when finished.');
      setStartTime('');
      setDescription('');
      onLogCreated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleLogComplete = async () => {
    if (!selectedContract || !startDate || !startTime || !endDate || !endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate dates
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    if (end <= start) {
      toast.error('End date/time must be after start date/time');
      return;
    }

    try {
      setLoading(true);
      const createRes: any = await api.post('/work-logs', {
        contractId: selectedContract,
        milestoneId: selectedMilestone || undefined,
        startDate,
        startTime,
        description,
      });
      
      const workLogId = createRes?.data?.workLog?._id;
      if (!workLogId) throw new Error('Failed to create work log');

      await api.patch(`/work-logs/${workLogId}/complete`, { endDate, endTime, description });
      toast.success('Work log saved!');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setDescription('');
      onLogCreated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save work log');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'freelancer') {
    return (
      <Card><CardContent>
        <Alert severity="info">Only freelancers can log work hours.</Alert>
      </CardContent></Card>
    );
  }

  const unsignedContracts = contracts.filter((c) => c.status === 'active' && !isContractFullySigned(c));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Log Work</Typography>
        
        {/* Mode Toggle */}
        <Box display="flex" gap={1} mb={3}>
          <Chip
            label="Log Completed Work"
            color={mode === 'complete' ? 'primary' : 'default'}
            onClick={() => setMode('complete')}
            variant={mode === 'complete' ? 'filled' : 'outlined'}
          />
          <Chip
            label="Start Session (Complete Later)"
            color={mode === 'start' ? 'primary' : 'default'}
            onClick={() => setMode('start')}
            variant={mode === 'start' ? 'filled' : 'outlined'}
          />
        </Box>

        {eligibleContracts.length === 0 ? (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              No eligible contracts. Contracts must be active and signed by both parties.
            </Alert>
            {unsignedContracts.length > 0 && (
              <Alert severity="info">
                {unsignedContracts.length} contract(s) awaiting signatures.
              </Alert>
            )}
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Contract Selection */}
            <FormControl fullWidth>
              <InputLabel>Contract *</InputLabel>
              <Select
                value={selectedContract}
                onChange={(e) => handleContractChange(e.target.value)}
                label="Contract *"
              >
                {eligibleContracts.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.title} - {c.project?.title || 'Project'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Milestone Selection */}
            {selectedContract && activeMilestones.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Milestone (optional)</InputLabel>
                <Select
                  value={selectedMilestone}
                  onChange={(e) => setSelectedMilestone(e.target.value)}
                  label="Milestone (optional)"
                >
                  <MenuItem value="">No specific milestone</MenuItem>
                  {activeMilestones.map((m: any) => (
                    <MenuItem key={m._id} value={m._id}>{m.title} - ${m.amount}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Divider />

            {/* Start Date/Time */}
            <Typography variant="subtitle2" color="text.secondary">
              {mode === 'start' ? 'When did you start?' : 'Start'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date *"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Time *"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {/* End Date/Time (only for complete mode) */}
            {mode === 'complete' && (
              <>
                <Typography variant="subtitle2" color="text.secondary">End</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="End Date *"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="End Time *"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {/* Description */}
            <TextField
              fullWidth
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              placeholder="What are you working on?"
            />

            {/* Submit Button */}
            {mode === 'start' ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={handleStartSession}
                disabled={loading || !selectedContract || !startDate || !startTime}
                size="large"
              >
                {loading ? 'Starting...' : 'Start Work Session'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Check />}
                onClick={handleLogComplete}
                disabled={loading || !selectedContract || !startDate || !startTime || !endDate || !endTime}
                size="large"
              >
                {loading ? 'Saving...' : 'Save Work Log'}
              </Button>
            )}

            {mode === 'start' && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Start a session now and complete it later from the Work Logs tab.
              </Alert>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkLogForm;
