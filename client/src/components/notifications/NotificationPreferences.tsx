import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiService } from '@/services/api';

export const NotificationPreferences: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiService.get('/notifications/preferences');
      return response.data.data.preferences;
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences: any) =>
      apiService.put('/notifications/preferences', preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferences updated successfully');
    },
    onError: () => {
      toast.error('Failed to update preferences');
    },
  });

  const handleToggle = (category: 'email' | 'push', key: string) => {
    if (!data) return;

    const updated = {
      ...data,
      [category]: {
        ...data[category],
        [key]: !data[category][key],
      },
    };

    updatePreferencesMutation.mutate(updated);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const preferences = data || { email: {}, push: {} };

  const notificationTypes = [
    { key: 'projectUpdates', label: 'Project Updates' },
    { key: 'proposalUpdates', label: 'Proposal Updates' },
    { key: 'contractUpdates', label: 'Contract Updates' },
    { key: 'paymentUpdates', label: 'Payment Updates' },
    { key: 'messages', label: 'Messages' },
    { key: 'reviews', label: 'Reviews' },
  ];

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Notification Preferences
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Choose how you want to receive notifications
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Email Notifications
        </Typography>
        <FormGroup>
          {notificationTypes.map(({ key, label }) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  checked={preferences.email[key] || false}
                  onChange={() => handleToggle('email', key)}
                />
              }
              label={label}
            />
          ))}
          <FormControlLabel
            control={
              <Switch
                checked={preferences.email.marketing || false}
                onChange={() => handleToggle('email', 'marketing')}
              />
            }
            label="Marketing & Promotions"
          />
        </FormGroup>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="h6" gutterBottom>
          Push Notifications
        </Typography>
        <FormGroup>
          {notificationTypes.map(({ key, label }) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  checked={preferences.push[key] || false}
                  onChange={() => handleToggle('push', key)}
                />
              }
              label={label}
            />
          ))}
        </FormGroup>
      </Box>
    </Paper>
  );
};