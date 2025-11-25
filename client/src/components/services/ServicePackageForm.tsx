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
  FormControl,
  InputLabel,
  Select,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as yup from 'yup';

const validationSchema = yup.object({
  title: yup.string()
    .required('Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: yup.string()
    .required('Description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must be at most 1000 characters'),
  category: yup.string()
    .required('Category is required'),
  amount: yup.number()
    .when('pricingType', {
      is: 'fixed',
      then: (schema) => schema
        .required('Fixed price is required')
        .min(1, 'Price must be at least $1')
        .max(100000, 'Price cannot exceed $100,000'),
      otherwise: (schema) => schema.notRequired(),
    }),
  hourlyRate: yup.number()
    .when('pricingType', {
      is: 'hourly',
      then: (schema) => schema
        .required('Hourly rate is required')
        .min(1, 'Rate must be at least $1')
        .max(500, 'Rate cannot exceed $500/hr'),
      otherwise: (schema) => schema.notRequired(),
    }),
  deliveryTime: yup.number()
    .required('Delivery time is required')
    .min(1, 'Delivery time must be at least 1 day')
    .max(365, 'Delivery time cannot exceed 365 days'),
  revisions: yup.number()
    .required('Revisions is required')
    .min(0, 'Revisions cannot be negative')
    .max(20, 'Revisions cannot exceed 20'),
  features: yup.array()
    .of(yup.string().min(1, 'Feature cannot be empty'))
    .min(1, 'At least one feature is required')
    .max(10, 'Maximum 10 features allowed'),
  skills: yup.array()
    .of(yup.string().min(1, 'Skill cannot be empty'))
    .min(1, 'At least one skill is required')
    .max(10, 'Maximum 10 skills allowed'),
});

const ServicePackageForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    pricingType: 'fixed',
    amount: '',
    hourlyRate: '',
    deliveryTime: '',
    revisions: '2',
    features: [''],
    requirements: [''],
    skills: [''],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    const array = [...(formData as any)[field]];
    array[index] = value;
    setFormData({ ...formData, [field]: array });
  };

  const addArrayItem = (field: string) => {
    setFormData({ ...formData, [field]: [...(formData as any)[field], ''] });
  };

  const removeArrayItem = (field: string, index: number) => {
    const array = [...(formData as any)[field]];
    array.splice(index, 1);
    setFormData({ ...formData, [field]: array });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      console.log('[SERVICE PACKAGE] Submitting form data:', formData);

      // Validate form data
      const validationData = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : '',
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : '',
        deliveryTime: formData.deliveryTime ? parseInt(formData.deliveryTime) : '',
        revisions: formData.revisions ? parseInt(formData.revisions) : '',
        features: formData.features.filter(f => f.trim()),
        skills: formData.skills.filter(s => s.trim()),
      };

      console.log('[SERVICE PACKAGE] Validation data:', validationData);

      await validationSchema.validate(validationData, { abortEarly: false });
      console.log('[SERVICE PACKAGE] Validation passed');

      const packageData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        pricing: {
          type: formData.pricingType,
          amount: formData.pricingType === 'fixed' ? parseFloat(formData.amount) : undefined,
          hourlyRate: formData.pricingType === 'hourly' ? parseFloat(formData.hourlyRate) : undefined,
        },
        deliveryTime: parseInt(formData.deliveryTime),
        revisions: parseInt(formData.revisions),
        features: formData.features.filter(f => f.trim()),
        requirements: formData.requirements.filter(r => r.trim()),
        skills: formData.skills.filter(s => s.trim()),
      };

      await api.post('/services/packages', packageData);
      toast.success('Service package created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      if (error.inner) {
        // Yup validation errors - show specific error messages
        const newErrors: Record<string, string> = {};
        const errorMessages: string[] = [];
        error.inner.forEach((err: any) => {
          newErrors[err.path] = err.message;
          errorMessages.push(err.message);
        });
        setErrors(newErrors);
        // Show first 3 specific errors in toast
        const displayErrors = errorMessages.slice(0, 3).join('. ');
        toast.error(displayErrors || 'Please fix the validation errors');
      } else {
        const message = error.response?.data?.message || 'Failed to create service package';
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Create Service Package
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Package Title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
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
              error={!!errors.description}
              helperText={errors.description}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              error={!!errors.category}
              helperText={errors.category}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Pricing Type</InputLabel>
              <Select
                value={formData.pricingType}
                onChange={(e) => handleChange('pricingType', e.target.value)}
                label="Pricing Type"
              >
                <MenuItem value="fixed">Fixed Price</MenuItem>
                <MenuItem value="hourly">Hourly Rate</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formData.pricingType === 'fixed' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Fixed Price"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                InputProps={{ startAdornment: '$' }}
                required
              />
            </Grid>
          )}

          {formData.pricingType === 'hourly' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Hourly Rate"
                value={formData.hourlyRate}
                onChange={(e) => handleChange('hourlyRate', e.target.value)}
                InputProps={{ startAdornment: '$' }}
                required
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Delivery Time (days)"
              value={formData.deliveryTime}
              onChange={(e) => handleChange('deliveryTime', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Number of Revisions"
              value={formData.revisions}
              onChange={(e) => handleChange('revisions', e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Features
            </Typography>
            {formData.features.map((feature, index) => (
              <Box key={index} display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  size="small"
                  value={feature}
                  onChange={(e) => handleArrayChange('features', index, e.target.value)}
                  placeholder="Enter feature"
                />
                <IconButton onClick={() => removeArrayItem('features', index)}>
                  <Delete />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<Add />} onClick={() => addArrayItem('features')}>
              Add Feature
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Requirements
            </Typography>
            {formData.requirements.map((req, index) => (
              <Box key={index} display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  size="small"
                  value={req}
                  onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                  placeholder="Enter requirement"
                />
                <IconButton onClick={() => removeArrayItem('requirements', index)}>
                  <Delete />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<Add />} onClick={() => addArrayItem('requirements')}>
              Add Requirement
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Skills
            </Typography>
            {formData.skills.map((skill, index) => (
              <Box key={index} display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  size="small"
                  value={skill}
                  onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                  placeholder="Enter skill"
                />
                <IconButton onClick={() => removeArrayItem('skills', index)}>
                  <Delete />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<Add />} onClick={() => addArrayItem('skills')}>
              Add Skill
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button onClick={() => navigate('/dashboard')}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmit}>
                Create Package
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ServicePackageForm;
