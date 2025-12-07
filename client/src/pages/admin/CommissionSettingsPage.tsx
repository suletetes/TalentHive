import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add, Edit, Delete, Settings as SettingsIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { settingsService, CommissionSetting } from '@/services/api/settings.service';
import { formatDollars } from '@/utils/currency';

export const CommissionSettingsPage: React.FC = () => {
  // Log on every render to confirm this component is being used
  console.log('[CommissionSettingsPage] Component rendering');
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<CommissionSetting | null>(null);
  const [isNewSetting, setIsNewSetting] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['commissionSettings'],
    queryFn: async () => {
      const response = await settingsService.getCommissionSettings();
      console.log('[CommissionSettingsPage] GET response:', response);
      return response;
    },
    staleTime: 0,
    gcTime: 0,
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: CommissionSetting[]) => {
      console.log('[CommissionSettingsPage] Saving settings:', settings);
      const response = await settingsService.updateCommissionSettings(settings);
      console.log('[CommissionSettingsPage] Save response:', response);
      return response;
    },
    onSuccess: async () => {
      console.log('[CommissionSettingsPage] Save successful, refetching...');
      await refetch();
      toast.success('Commission settings updated successfully');
      setEditDialogOpen(false);
    },
    onError: (error) => {
      console.error('[CommissionSettingsPage] Save error:', error);
      toast.error('Failed to update commission settings');
    },
  });

  const handleEdit = (setting: CommissionSetting) => {
    console.log('[CommissionSettingsPage] handleEdit called:', setting);
    setEditingSetting({ ...setting });
    setIsNewSetting(false);
    setEditDialogOpen(true);
  };

  const handleAdd = () => {
    console.log('[CommissionSettingsPage] handleAdd called');
    setEditingSetting({
      name: '',
      commissionPercentage: 5,
      minAmount: undefined,
      maxAmount: undefined,
      description: '',
      isActive: true,
    });
    setIsNewSetting(true);
    setEditDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    console.log('[CommissionSettingsPage] handleDelete called, index:', index);
    const settings = data?.data || [];
    console.log('[CommissionSettingsPage] Current settings:', settings);
    const newSettings = settings.filter((_, i) => i !== index);
    console.log('[CommissionSettingsPage] New settings after delete:', newSettings);
    updateMutation.mutate(newSettings);
  };

  const handleSave = () => {
    console.log('[CommissionSettingsPage] handleSave called');
    console.log('[CommissionSettingsPage] editingSetting:', editingSetting);
    console.log('[CommissionSettingsPage] isNewSetting:', isNewSetting);
    
    if (!editingSetting) {
      console.log('[CommissionSettingsPage] No editingSetting, returning');
      return;
    }

    const settings = data?.data || [];
    console.log('[CommissionSettingsPage] Current settings from data:', settings);
    
    let newSettings: CommissionSetting[];

    if (isNewSetting) {
      newSettings = [...settings, editingSetting];
      console.log('[CommissionSettingsPage] Adding new setting, newSettings:', newSettings);
    } else {
      const index = settings.findIndex(s => s.name === editingSetting.name);
      console.log('[CommissionSettingsPage] Editing existing setting at index:', index);
      newSettings = [...settings];
      newSettings[index] = editingSetting;
      console.log('[CommissionSettingsPage] Updated settings:', newSettings);
    }

    console.log('[CommissionSettingsPage] Calling mutation with:', newSettings);
    updateMutation.mutate(newSettings);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load commission settings" />;

  const settings = data?.data || [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4">Commission Settings</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add Tier
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Commission %</TableCell>
                <TableCell align="right">Min Amount</TableCell>
                <TableCell align="right">Max Amount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No commission settings found. Click "Add Tier" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                settings.map((setting, index) => (
                  <TableRow key={index}>
                    <TableCell>{setting.name}</TableCell>
                    <TableCell align="right">{setting.commissionPercentage}%</TableCell>
                    <TableCell align="right">
                      {setting.minAmount ? formatDollars(setting.minAmount) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {setting.maxAmount ? formatDollars(setting.maxAmount) : '-'}
                    </TableCell>
                    <TableCell>{setting.description || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={setting.isActive ? 'Active' : 'Inactive'}
                        color={setting.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEdit(setting)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(index)} color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isNewSetting ? 'Add Commission Tier' : 'Edit Commission Tier'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={editingSetting?.name || ''}
              onChange={(e) => setEditingSetting(prev => prev ? { ...prev, name: e.target.value } : null)}
            />
            <TextField
              fullWidth
              type="number"
              label="Commission Percentage"
              value={editingSetting?.commissionPercentage || 0}
              onChange={(e) => setEditingSetting(prev => prev ? { ...prev, commissionPercentage: Number(e.target.value) } : null)}
              inputProps={{ min: 0, max: 100, step: 0.1 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Minimum Amount (optional)"
              value={editingSetting?.minAmount || ''}
              onChange={(e) => setEditingSetting(prev => prev ? { ...prev, minAmount: e.target.value ? Number(e.target.value) : undefined } : null)}
            />
            <TextField
              fullWidth
              type="number"
              label="Maximum Amount (optional)"
              value={editingSetting?.maxAmount || ''}
              onChange={(e) => setEditingSetting(prev => prev ? { ...prev, maxAmount: e.target.value ? Number(e.target.value) : undefined } : null)}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={editingSetting?.description || ''}
              onChange={(e) => setEditingSetting(prev => prev ? { ...prev, description: e.target.value } : null)}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editingSetting?.isActive || false}
                  onChange={(e) => setEditingSetting(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={updateMutation.isPending}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
