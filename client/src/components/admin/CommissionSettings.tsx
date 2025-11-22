import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

interface CommissionSetting {
  _id: string;
  name: string;
  percentage: number;
  minAmount: number;
  maxAmount: number;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommissionSettingsProps {
  settings?: CommissionSetting[];
  isLoading?: boolean;
  onSave?: (settings: Partial<CommissionSetting>) => Promise<void>;
}

export const CommissionSettings: React.FC<CommissionSettingsProps> = ({
  settings = [],
  isLoading = false,
  onSave,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CommissionSetting>>({
    percentage: 0,
    minAmount: 0,
    maxAmount: 0,
    description: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleEdit = (setting: CommissionSetting) => {
    setEditingId(setting._id);
    setFormData(setting);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      percentage: 0,
      minAmount: 0,
      maxAmount: 0,
      description: '',
    });
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      setMessage('Commission settings updated successfully');
      setEditingId(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update commission settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Commission Settings
        </Typography>

        {message && (
          <Alert severity={message.includes('Failed') ? 'error' : 'success'} sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        {editingId ? (
          <Box sx={{ mb: 4, p: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Edit Commission Setting
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Commission Percentage"
                  type="number"
                  value={formData.percentage || 0}
                  onChange={(e) => handleChange('percentage', parseFloat(e.target.value))}
                  fullWidth
                  inputProps={{ step: '0.1', min: '0', max: '100' }}
                  helperText="Enter percentage (0-100)"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Minimum Amount"
                  type="number"
                  value={formData.minAmount || 0}
                  onChange={(e) => handleChange('minAmount', parseFloat(e.target.value))}
                  fullWidth
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Maximum Amount"
                  type="number"
                  value={formData.maxAmount || 0}
                  onChange={(e) => handleChange('maxAmount', parseFloat(e.target.value))}
                  fullWidth
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outlined" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ) : null}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Name</TableCell>
                <TableCell align="right">Commission %</TableCell>
                <TableCell align="right">Min Amount</TableCell>
                <TableCell align="right">Max Amount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No commission settings found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                settings.map((setting) => (
                  <TableRow key={setting._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {setting.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{setting.percentage}%</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">${setting.minAmount.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">${setting.maxAmount.toFixed(2)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {setting.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={setting.active ? 'Active' : 'Inactive'}
                        color={setting.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        onClick={() => handleEdit(setting)}
                        disabled={editingId !== null}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
