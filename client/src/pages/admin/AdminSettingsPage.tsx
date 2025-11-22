import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { CommissionSettings } from '@/components/admin/CommissionSettings';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import toast from 'react-hot-toast';
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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const AdminSettingsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);

  // Fetch settings
  const { data: settingsData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/settings');
      return response.data.data;
    },
    enabled: user?.role === 'admin',
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await axios.put('/api/v1/settings', settings);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveCommissionSettings = async (settings: any) => {
    updateSettingsMutation.mutate({
      commission: settings,
    });
  };

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          You do not have permission to access this page.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />;
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
        Admin Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure platform settings and policies
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin settings tabs"
          >
            <Tab label="Commission Settings" id="admin-tab-0" aria-controls="admin-tabpanel-0" />
            <Tab label="Payment Settings" id="admin-tab-1" aria-controls="admin-tabpanel-1" />
            <Tab label="Platform Settings" id="admin-tab-2" aria-controls="admin-tabpanel-2" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CommissionSettings
            settings={settingsData?.commission || []}
            isLoading={updateSettingsMutation.isPending}
            onSave={handleSaveCommissionSettings}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment Settings
            </Typography>
            <Typography color="text.secondary">
              Payment settings configuration coming soon...
            </Typography>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Platform Settings
            </Typography>
            <Typography color="text.secondary">
              Platform settings configuration coming soon...
            </Typography>
          </CardContent>
        </TabPanel>
      </Card>
    </Container>
  );
};
