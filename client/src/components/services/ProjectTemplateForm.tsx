import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Checkbox,
  MenuItem,
} from '@mui/material';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';

const ProjectTemplateForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budgetMin: '',
    budgetMax: '',
    duration: '',
    isRecurring: false,
    frequency: 'monthly',
  });

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    try {
      const templateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: {
          min: parseFloat(formData.budgetMin),
          max: parseFloat(formData.budgetMax),
        },
        duration: parseInt(formData.duration),
        isRecurring: formData.isRecurring,
        recurringSchedule: formData.isRecurring
          ? {
              frequency: formData.frequency,
              autoPost: false,
            }
          : undefined,
      };

      await api.post('/services/templates', templateData);
      alert('Project template created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create template');
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Create Project Template
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Template Title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
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
              rows={4}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Duration (days)"
              value={formData.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Budget"
              value={formData.budgetMin}
              onChange={(e) => handleChange('budgetMin', e.target.value)}
              InputProps={{ startAdornment: '$' }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Maximum Budget"
              value={formData.budgetMax}
              onChange={(e) => handleChange('budgetMax', e.target.value)}
              InputProps={{ startAdornment: '$' }}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isRecurring}
                  onChange={(e) => handleChange('isRecurring', e.target.checked)}
                />
              }
              label="Recurring Project"
            />
          </Grid>

          {formData.isRecurring && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Frequency"
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
              >
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
              </TextField>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button onClick={() => navigate('/dashboard')}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmit}>
                Create Template
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ProjectTemplateForm;
