import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Business } from '@mui/icons-material';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';

const steps = ['Basic Information', 'Budget Settings', 'Review'];

const OrganizationForm: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    size: '',
    website: '',
    monthlyBudget: '',
    approvalThreshold: '1000',
    autoApproveBelow: '500',
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const response = await api.post('/organizations', {
        name: formData.name,
        description: formData.description,
        industry: formData.industry,
        size: formData.size,
        website: formData.website,
        budgetSettings: {
          monthlyBudget: formData.monthlyBudget ? parseFloat(formData.monthlyBudget) : undefined,
          approvalThreshold: parseFloat(formData.approvalThreshold),
          autoApproveBelow: formData.autoApproveBelow ? parseFloat(formData.autoApproveBelow) : undefined,
        },
      });

      alert('Organization created successfully!');
      navigate(`/organizations/${response.data.data.organization._id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create organization');
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Organization Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Industry"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Company Size"
                value={formData.size}
                onChange={(e) => handleChange('size', e.target.value)}
              >
                <MenuItem value="1-10">1-10 employees</MenuItem>
                <MenuItem value="11-50">11-50 employees</MenuItem>
                <MenuItem value="51-200">51-200 employees</MenuItem>
                <MenuItem value="201-500">201-500 employees</MenuItem>
                <MenuItem value="501-1000">501-1000 employees</MenuItem>
                <MenuItem value="1000+">1000+ employees</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Configure budget approval settings for your organization
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Monthly Budget (Optional)"
                value={formData.monthlyBudget}
                onChange={(e) => handleChange('monthlyBudget', e.target.value)}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Approval Threshold"
                value={formData.approvalThreshold}
                onChange={(e) => handleChange('approvalThreshold', e.target.value)}
                required
                InputProps={{ startAdornment: '$' }}
                helperText="Expenses above this amount require approval"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Auto-Approve Below"
                value={formData.autoApproveBelow}
                onChange={(e) => handleChange('autoApproveBelow', e.target.value)}
                InputProps={{ startAdornment: '$' }}
                helperText="Expenses below this amount are auto-approved"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Organization Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{formData.name}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">{formData.description || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Industry
                </Typography>
                <Typography variant="body1">{formData.industry || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Size
                </Typography>
                <Typography variant="body1">{formData.size || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Approval Threshold
                </Typography>
                <Typography variant="body1">${formData.approvalThreshold}</Typography>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Business color="primary" />
          <Typography variant="h5">Create Organization</Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box mb={4}>{renderStepContent()}</Box>

        <Box display="flex" justifyContent="space-between">
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Box display="flex" gap={2}>
            <Button onClick={() => navigate('/dashboard')}>Cancel</Button>
            {activeStep === steps.length - 1 ? (
              <Button variant="contained" onClick={handleSubmit}>
                Create Organization
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OrganizationForm;
