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
  projectId?: string;
  contractId?: string;
  projects?: any[];
  contracts?: any[];
}

const TimeTracker: React.FC<TimeTrackerProps> = ({ 
  projectId, 
  contractId,
  projects: propProjects = [],
  contracts: propContracts = [],
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [selectedContract, setSelectedContract] = useState(contractId || '');
  const [projects, setProjects] = useState<any[]>(propProjects);
  const [contracts, setContracts] = useState<any[]>(propContracts);
  const [currentSession, setCurrentSession] = useState<any>(null);

  // Update local state when props change
  useEffect(() => {
    if (propProjects.length > 0) {
      setProjects(propProjects);
    }
  }, [propProjects]);

  useEffect(() => {
    if (propContracts.length > 0) {
      setContracts(propContracts);
    }
  }, [propContracts]);

  // Fetch data only if not provided via props
  useEffect(() => {
    if (propProjects.length === 0 && propContracts.length === 0) {
      fetchProjects();
      fetchContracts();
    }
  }, [user, propProjects.length, propContracts.length]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && !isPaused) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, isPaused]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects/my/projects');
      const projectsList = response?.data?.data?.projects || response?.data?.projects || response?.data?.data || [];
      console.log('[TIME TRACKER] Fetched projects:', projectsList);
      setProjects(Array.isArray(projectsList) ? projectsList : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

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

  const handleStart = async () => {
    if (!selectedProject || !selectedContract) {
      alert('Please select a project and contract');
      return;
    }

    try {
      const response = await api.post('/time-tracking/sessions/start', {
        projectId: selectedProject,
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
      
      // Create time entry
      await api.post('/time-tracking/entries', {
        projectId: selectedProject,
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

          {/* Project and Contract Selection */}
          {!isTracking && (
            <>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  label="Project"
                >
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Contract</InputLabel>
                <Select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  label="Contract"
                >
                  {contracts.map((contract) => (
                    <MenuItem key={contract._id} value={contract._id}>
                      {contract.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
