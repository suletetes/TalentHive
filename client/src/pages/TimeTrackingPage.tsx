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
import TimeTracker from '@/components/timeTracking/TimeTracker';
import TimeEntryList from '@/components/timeTracking/TimeEntryList';
import TimeReport from '@/components/timeTracking/TimeReport';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiCore } from '@/services/api/core';
import { apiService } from '@/services/api';

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
      console.log(`[TIME TRACKING] ========== START FETCH ENTRIES ==========`);
      console.log(`[TIME TRACKING] User ID: ${user?._id}`);
      console.log(`[TIME TRACKING] User role: ${user?.role}`);
      try {
        const response = await apiCore.get('/time-tracking/entries');
        console.log(`[TIME TRACKING] Raw response:`, response.data);
        console.log(`[TIME TRACKING] response.data type:`, typeof response.data);
        console.log(`[TIME TRACKING] response.data.data:`, response.data?.data);
        
        let entries = [];
        if (response.data?.data?.timeEntries && Array.isArray(response.data.data.timeEntries)) {
          entries = response.data.data.timeEntries;
          console.log(`[TIME TRACKING] ✅ Using response.data.data.timeEntries (${entries.length} items)`);
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          entries = response.data.data;
          console.log(`[TIME TRACKING] ✅ Using response.data.data (${entries.length} items)`);
        } else if (Array.isArray(response.data)) {
          entries = response.data;
          console.log(`[TIME TRACKING] ✅ Using response.data directly (${entries.length} items)`);
        }
        
        console.log(`[TIME TRACKING] Final result: Found ${entries.length} time entries`);
        console.log(`[TIME TRACKING] ========== END FETCH ENTRIES ==========`);
        return entries;
      } catch (err: any) {
        console.error(`[TIME TRACKING ERROR] ❌ Error fetching time entries:`, err.response?.status, err.response?.data);
        throw err;
      }
    },
    enabled: !!user,
  });

  // Fetch projects for dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['time-tracking-projects'],
    queryFn: async () => {
      console.log(`[TIME TRACKING] Fetching projects for dropdown...`);
      try {
        const response = await apiService.get('/projects/my');
        console.log(`[TIME TRACKING] Projects response:`, response.data);
        const projects = response.data?.data?.projects || response.data?.data || [];
        console.log(`[TIME TRACKING] ✅ Found ${projects.length} projects`);
        return projects;
      } catch (err: any) {
        console.error(`[TIME TRACKING] Error fetching projects:`, err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch contracts for dropdown
  const { data: contractsData } = useQuery({
    queryKey: ['time-tracking-contracts'],
    queryFn: async () => {
      console.log(`[TIME TRACKING] Fetching contracts for dropdown...`);
      try {
        const response = await apiService.get('/contracts/my');
        console.log(`[TIME TRACKING] Contracts response:`, response.data);
        const contracts = response.data?.data?.contracts || response.data?.data || [];
        console.log(`[TIME TRACKING] ✅ Found ${contracts.length} contracts`);
        return contracts;
      } catch (err: any) {
        console.error(`[TIME TRACKING] Error fetching contracts:`, err);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch time reports
  const { data: reportsData } = useQuery({
    queryKey: ['time-reports'],
    queryFn: async () => {
      console.log(`[TIME TRACKING] ========== START FETCH REPORTS ==========`);
      try {
        const response = await apiCore.get('/time-tracking/reports');
        console.log(`[TIME TRACKING] Reports response:`, response.data);
        
        let reports = [];
        if (response.data?.data && Array.isArray(response.data.data)) {
          reports = response.data.data;
          console.log(`[TIME TRACKING] ✅ Using response.data.data (${reports.length} items)`);
        } else if (Array.isArray(response.data)) {
          reports = response.data;
          console.log(`[TIME TRACKING] ✅ Using response.data directly (${reports.length} items)`);
        }
        
        console.log(`[TIME TRACKING] Final result: Found ${reports.length} reports`);
        console.log(`[TIME TRACKING] ========== END FETCH REPORTS ==========`);
        return reports;
      } catch (err: any) {
        console.error(`[TIME TRACKING ERROR] ❌ Error fetching time reports:`, err.response?.status, err.response?.data);
        throw err;
      }
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
          <TimeTracker projects={projectsData || []} contracts={contractsData || []} />
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
