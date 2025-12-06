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
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

interface PlatformSettingsProps {
  settings?: any;
  isLoading?: boolean;
  onSave?: (settings: any) => void;
}

export const PlatformSettings: React.FC<PlatformSettingsProps> = ({
  settings = {},
  isLoading = false,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    platformName: settings.platformName || 'TalentHive',
    supportEmail: settings.supportEmail || 'support@talenthive.com',
    maintenanceMode: settings.maintenanceMode || false,
    requireEmailVerification: settings.requireEmailVerification || true,
    requirePhoneVerification: settings.requirePhoneVerification || false,
    maxProjectsPerUser: settings.maxProjectsPerUser || 50,
    maxProposalsPerProject: settings.maxProposalsPerProject || 100,
    enableNewUserRegistration: settings.enableNewUserRegistration || true,
    enableFreelancerSignup: settings.enableFreelancerSignup || true,
    enableClientSignup: settings.enableClientSignup || true,
  });

  useEffect(() => {
    setFormData({
      platformName: settings.platformName || 'TalentHive',
      supportEmail: settings.supportEmail || 'support@talenthive.com',
      maintenanceMode: settings.maintenanceMode || false,
      requireEmailVerification: settings.requireEmailVerification || true,
      requirePhoneVerification: settings.requirePhoneVerification || false,
      maxProjectsPerUser: settings.maxProjectsPerUser || 50,
      maxProposalsPerProject: settings.maxProposalsPerProject || 100,
      enableNewUserRegistration: settings.enableNewUserRegistration || true,
      enableFreelancerSignup: settings.enableFreelancerSignup || true,
      enableClientSignup: settings.enableClientSignup || true,
    });
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    if (!formData.platformName.trim()) {
      toast.error('Platform name is required');
      return;
    }

    if (!formData.supportEmail.includes('@')) {
      toast.error('Valid support email is required');
      return;
    }

    onSave?.(formData);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Configure general platform settings and policies
      </Alert>

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            General Settings
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Platform Name"
            value={formData.platformName}
            onChange={(e) => handleChange('platformName', e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Support Email"
            type="email"
            value={formData.supportEmail}
            onChange={(e) => handleChange('supportEmail', e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              />
            }
            label="Maintenance Mode"
          />
          <Typography variant="caption" color="text.secondary">
            Disable platform access for maintenance
          </Typography>
        </Grid>

        {/* Verification Settings */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Verification Requirements
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.requireEmailVerification}
                onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
              />
            }
            label="Require Email Verification"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.requirePhoneVerification}
                onChange={(e) => handleChange('requirePhoneVerification', e.target.checked)}
              />
            }
            label="Require Phone Verification"
          />
        </Grid>

        {/* Registration Settings */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Registration Settings
          </Typography>
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.enableNewUserRegistration}
                onChange={(e) => handleChange('enableNewUserRegistration', e.target.checked)}
              />
            }
            label="Enable New User Registration"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.enableFreelancerSignup}
                onChange={(e) => handleChange('enableFreelancerSignup', e.target.checked)}
              />
            }
            label="Enable Freelancer Signup"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.enableClientSignup}
                onChange={(e) => handleChange('enableClientSignup', e.target.checked)}
              />
            }
            label="Enable Client Signup"
          />
        </Grid>

        {/* Limits */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Platform Limits
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Max Projects Per User"
            type="number"
            value={formData.maxProjectsPerUser}
            onChange={(e) => handleChange('maxProjectsPerUser', parseInt(e.target.value))}
            fullWidth
            inputProps={{ min: 1 }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Max Proposals Per Project"
            type="number"
            value={formData.maxProposalsPerProject}
            onChange={(e) => handleChange('maxProposalsPerProject', parseInt(e.target.value))}
            fullWidth
            inputProps={{ min: 1 }}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? 'Saving...' : 'Save Platform Settings'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
