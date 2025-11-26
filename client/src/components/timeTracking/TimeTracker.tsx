import React, { useState, useEffect } from 'react';
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
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Timer,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import api from '@/services/api';

interface TimeTrackerProps {
  contractId?: string;
  contracts?: any[];
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ 
  contractId,
  contracts: propContracts = [],
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [description, setDescription] = useState('');
  const [selectedContract, setSelectedContract] = useState(contractId || '');
  const [contracts, setContracts] = useState<any[]>(propContracts);
  const [currentSession, setCurrentSession] = useState<any>(null);

  // Update local state when props change
  useEffect(() => {
    if (propContracts.length > 0) {
      setContracts(propContracts);
    }
  }, [propContracts]);

  // Fetch contracts only if not provided via props
  useEffect(() => {
    if (propContracts.length === 0) {
      fetchContracts();
    }
  }, [user, propContracts.length]);

  // Check for active session on mount
  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const response = await api.get('/time-tracking/sessions/active');
      if (response?.data?.data?.session) {
        const session = response.data.data.session;
        setCurrentSession(session);
        setSelectedContract(session.contract?._id || session.contract);
        setIsTracking(true);
        // Calculate elapsed time
        const startTime = new Date(session.startTime).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);
      }
    } catch (error) {
      // No active session, that's fine
      console.log('[TIME TRACKER] No active session found');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && !isPaused) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, isPaused]);

  const fetchContracts = async () => {
    try {
      const response = await api.get('/contracts/my');
      const contractsList = response?.data?.data?.contracts || response?.data?.contracts || response?.data?.data || [];
      console.log('[TIME TRACKER] Fetched contracts:', contractsList);
      setContracts(Array.isArray(contractsList) ? contractsList : []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setContracts([]);
    }
  };

  // Filter to only show active contracts for the freelancer
  const activeContracts = contracts.filter(c => c.status === 'active');

  // Get selected contract details
  const selectedContractData = contracts.find(c => c._id === selectedContract);

  const handleStart = async () => {
    if (!selectedContract) {
      alert('Please select a contract');
      return;
    }

    try {
      const response = await api.post('/time-tracking/sessions/start', {
        contractId: selectedContract,
      });
      setCurrentSession(response.data.data.session);
      setIsTracking(true);
      setIsPaused(false);
      setDuration(0);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start tracking');
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = async () => {
    if (!currentSession) return;

    try {
      await api.patch(`/time-tracking/sessions/${currentSession._id}/stop`);
      
      // Create time entry - projectId is extracted from contract on backend
      await api.post('/time-tracking/entries', {
        contractId: selectedContract,
        description,
        duration,
      });

      setIsTracking(false);
      setIsPaused(false);
      setDuration(0);
      setDescription('');
      setCurrentSession(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to stop tracking');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Timer color="primary" />
          <Typography variant="h6">Time Tracker</Typography>
          {isTracking && (
            <Chip
              label={isPaused ? 'Paused' : 'Tracking'}
              color={isPaused ? 'warning' : 'success'}
              size="small"
            />
          )}
        </Box>

        <Box display="flex" flexDirection="column" gap={2}>
          {/* Timer Display */}
          <Box
            sx={{
              textAlign: 'center',
              py: 3,
              bgcolor: 'background.default',
              borderRadius: 1,
            }}
          >
            <Typography variant="h3" fontFamily="monospace">
              {formatTime(duration)}
            </Typography>
          </Box>

          {/* Contract Selection - Only for freelancers */}
          {!isTracking && (
            <>
              {user?.role !== 'freelancer' ? (
                <Alert severity="info">
                  Only freelancers can track time. Clients can view time entries in the Time Entries tab.
                </Alert>
              ) : contracts.length === 0 ? (
                <Alert severity="warning">
                  No contracts found. You need a contract to track time.
                </Alert>
              ) : activeContracts.length === 0 ? (
                <Alert severity="warning">
                  No active contracts found. You have {contracts.length} contract(s) but none are active.
                  Contract statuses: {contracts.map(c => c.status).join(', ')}
                </Alert>
              ) : (
                <>
                  <FormControl fullWidth>
                    <InputLabel id="contract-select-label">Select Contract</InputLabel>
                    <Select
                      labelId="contract-select-label"
                      value={selectedContract}
                      onChange={(e) => setSelectedContract(e.target.value as string)}
                      label="Select Contract"
                    >
                      {activeContracts.map((contract) => (
                        <MenuItem key={contract._id} value={contract._id}>
                          {contract.title} - {contract.project?.title || 'Project'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedContractData && (
                    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Project: {selectedContractData.project?.title || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Client: {selectedContractData.client?.firstName} {selectedContractData.client?.lastName}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </>
          )}

          {/* Description */}
          <TextField
            fullWidth
            label="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            disabled={!isTracking}
          />

          {/* Control Buttons */}
          <Box display="flex" gap={2} justifyContent="center">
            {!isTracking ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={handleStart}
                size="large"
                disabled={user?.role !== 'freelancer' || !selectedContract}
              >
                Start Tracking
              </Button>
            ) : (
              <>
                <IconButton
                  color={isPaused ? 'primary' : 'warning'}
                  onClick={handlePause}
                  size="large"
                >
                  {isPaused ? <PlayArrow /> : <Pause />}
                </IconButton>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStop}
                  size="large"
                >
                  Stop & Save
                </Button>
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TimeTracker;
