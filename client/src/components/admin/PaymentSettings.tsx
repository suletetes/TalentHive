import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

interface PaymentSettingsProps {
  settings?: any;
  isLoading?: boolean;
  onSave?: (settings: any) => void;
}

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({
  settings = {},
  isLoading = false,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    currency: settings.currency || 'USD',
    escrowPeriod: settings.escrowPeriod || 7,
    autoRelease: settings.autoRelease || false,
    minTransactionAmount: settings.minTransactionAmount || 10,
    maxTransactionAmount: settings.maxTransactionAmount || 100000,
    paymentMethods: settings.paymentMethods || ['credit_card', 'bank_transfer'],
  });

  useEffect(() => {
    setFormData({
      currency: settings.currency || 'USD',
      escrowPeriod: settings.escrowPeriod || 7,
      autoRelease: settings.autoRelease || false,
      minTransactionAmount: settings.minTransactionAmount || 10,
      maxTransactionAmount: settings.maxTransactionAmount || 100000,
      paymentMethods: settings.paymentMethods || ['credit_card', 'bank_transfer'],
    });
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (formData.minTransactionAmount >= formData.maxTransactionAmount) {
      toast.error('Minimum amount must be less than maximum amount');
      return;
    }

    if (formData.escrowPeriod < 1 || formData.escrowPeriod > 90) {
      toast.error('Escrow period must be between 1 and 90 days');
      return;
    }

    onSave?.(formData);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Configure payment processing settings for the platform
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Currency"
            value={formData.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            fullWidth
            disabled
            helperText="Currently USD only"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Escrow Period (days)"
            type="number"
            value={formData.escrowPeriod}
            onChange={(e) => handleChange('escrowPeriod', parseInt(e.target.value))}
            fullWidth
            inputProps={{ min: 1, max: 90 }}
            helperText="How long funds are held in escrow"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Minimum Transaction Amount"
            type="number"
            value={formData.minTransactionAmount}
            onChange={(e) => handleChange('minTransactionAmount', parseFloat(e.target.value))}
            fullWidth
            inputProps={{ min: 0, step: 0.01 }}
            helperText="Minimum payment amount allowed"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Maximum Transaction Amount"
            type="number"
            value={formData.maxTransactionAmount}
            onChange={(e) => handleChange('maxTransactionAmount', parseFloat(e.target.value))}
            fullWidth
            inputProps={{ min: 0, step: 0.01 }}
            helperText="Maximum payment amount allowed"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.autoRelease}
                onChange={(e) => handleChange('autoRelease', e.target.checked)}
              />
            }
            label="Auto-release funds after escrow period"
          />
          <Typography variant="caption" color="text.secondary">
            Automatically release funds to freelancer after escrow period expires
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Accepted Payment Methods
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Credit Card, Bank Transfer
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? 'Saving...' : 'Save Payment Settings'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
