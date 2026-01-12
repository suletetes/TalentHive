import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import WorkLogForm from '@/components/workLog/WorkLogForm';
import WorkLogList from '@/components/workLog/WorkLogList';
import WorkLogReport from '@/components/workLog/WorkLogReport';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiService } from '@/services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  keepMounted?: boolean;
}

// Keep tabs mounted to prevent reloading
function TabPanel(props: TabPanelProps) {
  const { children, value, index, keepMounted = true, ...other } = props;

  if (!keepMounted && value !== index) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`work-log-tabpanel-${index}`}
      aria-labelledby={`work-log-tab-${index}`}
      style={{ display: value === index ? 'block' : 'none' }}
      {...other}
    >
      <Box sx={{ py: 3 }}>{children}</Box>
    </div>
  );
}

export const TimeTrackingPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch contracts for dropdown with caching
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['work-log-contracts'],
    queryFn: async () => {
      try {
        const response: any = await apiService.get('/contracts/my');
        let contracts = [];
        if (response?.data?.contracts && Array.isArray(response.data.contracts)) {
          contracts = response.data.contracts;
        } else if (response?.contracts && Array.isArray(response.contracts)) {
          contracts = response.contracts;
        } else if (Array.isArray(response?.data)) {
          contracts = response.data;
        } else if (Array.isArray(response)) {
          contracts = response;
        }
        return contracts;
      } catch (err: any) {
        console.error('Error fetching contracts:', err);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLogCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">You must be logged in to access work logs.</Alert>
      </Container>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  const isFreelancer = user.role === 'freelancer';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Work Log
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {isFreelancer
          ? 'Log your work hours for your contracts'
          : 'View work hours logged by your freelancers'}
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="work log tabs">
            {isFreelancer && <Tab label="Log Hours" />}
            <Tab label="Work Logs" />
            <Tab label="Reports" />
          </Tabs>
        </Box>

        {isFreelancer ? (
          <>
            <TabPanel value={tabValue} index={0}>
              <WorkLogForm contracts={contractsData || []} onLogCreated={handleLogCreated} />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <WorkLogList refreshTrigger={refreshTrigger} />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <WorkLogReport />
            </TabPanel>
          </>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              <WorkLogList refreshTrigger={refreshTrigger} />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <WorkLogReport />
            </TabPanel>
          </>
        )}
      </Card>
    </Container>
  );
};

export default TimeTrackingPage;
