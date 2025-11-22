import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Grid,
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { TimeTracker } from '@/components/timeTracking/TimeTracker';
import { TimeEntryList } from '@/components/timeTracking/TimeEntryList';
import { TimeReport } from '@/components/timeTracking/TimeReport';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import axios from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`time-tracking-tabpanel-${index}`}
      aria-labelledby={`time-tracking-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const TimeTrackingPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);

  // Fetch time entries
  const { data: entriesData, isLoading, error, refetch } = useQuery({
    queryKey: ['time-entries'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/time-tracking/entries');
      return response.data.data;
    },
    enabled: !!user,
  });

  // Fetch time reports
  const { data: reportsData } = useQuery({
    queryKey: ['time-reports'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/time-tracking/reports');
      return response.data.data;
    },
    enabled: !!user,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          You must be logged in to access time tracking.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading time tracking..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={error} onRetry={() => refetch()} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Time Tracking
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track your work hours and productivity
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="time tracking tabs"
          >
            <Tab label="Time Tracker" id="time-tracking-tab-0" aria-controls="time-tracking-tabpanel-0" />
            <Tab label="Time Entries" id="time-tracking-tab-1" aria-controls="time-tracking-tabpanel-1" />
            <Tab label="Reports" id="time-tracking-tab-2" aria-controls="time-tracking-tabpanel-2" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TimeTracker />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TimeEntryList entries={entriesData || []} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TimeReport data={reportsData || []} />
        </TabPanel>
      </Card>
    </Container>
  );
};
