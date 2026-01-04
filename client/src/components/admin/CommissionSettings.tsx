import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface CommissionSetting {
  _id?: string;
  name: string;
  commissionPercentage: number;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
  isActive: boolean;
}

interface CommissionSettingsProps {
  settings?: CommissionSetting[];
  isLoading?: boolean;
  onSave?: (settings: CommissionSetting[]) => Promise<void>;
}

const defaultSetting: CommissionSetting = {
  name: '',
  commissionPercentage: 5,
  minAmount: undefined,
  maxAmount: undefined,
  description: '',
  isActive: true,
};

export const CommissionSettings: React.FC<CommissionSettingsProps> = ({
  settings = [],
  isLoading = false,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<CommissionSetting[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [currentSetting, setCurrentSetting] = useState<CommissionSetting>(defaultSetting);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setLocalSettings(settings || []);
  }, [settings]);

  const handleOpenDialog = (index?: number) => {
    if (index !== undefined) {
      setEditIndex(index);
      setCurrentSetting({ ...localSettings[index] });
    } else {
      setEditIndex(null);
      setCurrentSetting({ ...defaultSetting });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditIndex(null);
    setCurrentSetting({ ...defaultSetting });
  };

  const handleSaveSetting = () => {
    const updatedSettings = [...localSettings];
    if (editIndex !== null) {
      updatedSettings[editIndex] = currentSetting;
    } else {
      updatedSettings.push(currentSetting);
    }
    setLocalSettings(updatedSettings);
    handleCloseDialog();
  };

  const handleOpenDeleteDialog = (index: number) => {
    setDeleteIndex(index);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteIndex(null);
  };

  const handleConfirmDelete = () => {
    if (deleteIndex !== null) {
      const updatedSettings = localSettings.filter((_, i) => i !== deleteIndex);
      setLocalSettings(updatedSettings);
    }
    handleCloseDeleteDialog();
  };

  const handleSaveAll = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(localSettings);
      setSuccessMessage('Commission settings saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (
    field: keyof CommissionSetting,
    value: string | number | boolean | undefined
  ) => {
    setCurrentSetting((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading && localSettings.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Commission Settings</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} size="small">
              Add Tier
            </Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveAll} disabled={isSaving} size="small">
              {isSaving ? 'Saving...' : 'Save All'}
            </Button>
          </Box>
        </Box>

        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Commission %</TableCell>
                <TableCell align="right">Min Amount ($)</TableCell>
                <TableCell align="right">Max Amount ($)</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {localSettings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No commission settings found. Click Add Tier to create one.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                localSettings.map((setting, index) => (
                  <TableRow key={index}>
                    <TableCell><Typography variant="body2" fontWeight="medium">{setting.name}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{setting.commissionPercentage}%</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{setting.minAmount ? `$${setting.minAmount.toLocaleString()}` : '-'}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{setting.maxAmount ? `$${setting.maxAmount.toLocaleString()}` : '-'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{setting.description || '-'}</Typography></TableCell>
                    <TableCell><Chip label={setting.isActive ? 'Active' : 'Inactive'} color={setting.isActive ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog(index)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(index)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editIndex !== null ? 'Edit Commission Tier' : 'Add Commission Tier'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Name" value={currentSetting.name} onChange={(e) => handleFieldChange('name', e.target.value)} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Commission %" type="number" value={currentSetting.commissionPercentage} onChange={(e) => handleFieldChange('commissionPercentage', parseFloat(e.target.value) || 0)} fullWidth slotProps={{ htmlInput: { step: '0.1', min: '0', max: '100' } }} helperText="Platform fee (0-100)" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Min Amount ($)" type="number" value={currentSetting.minAmount || ''} onChange={(e) => handleFieldChange('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)} fullWidth slotProps={{ htmlInput: { step: '100', min: '0' } }} helperText="Optional" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Max Amount ($)" type="number" value={currentSetting.maxAmount || ''} onChange={(e) => handleFieldChange('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)} fullWidth slotProps={{ htmlInput: { step: '100', min: '0' } }} helperText="Optional" />
              </Grid>
              <Grid size={12}>
                <TextField label="Description" value={currentSetting.description || ''} onChange={(e) => handleFieldChange('description', e.target.value)} fullWidth multiline rows={2} />
              </Grid>
              <Grid size={12}>
                <FormControlLabel control={<Switch checked={currentSetting.isActive} onChange={(e) => handleFieldChange('isActive', e.target.checked)} />} label="Active" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveSetting} variant="contained" disabled={!currentSetting.name.trim()}>{editIndex !== null ? 'Update' : 'Add'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Delete Commission Tier</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this commission tier? This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
