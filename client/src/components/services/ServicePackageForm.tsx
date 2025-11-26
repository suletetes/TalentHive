import React, { useState, useEffect } from 'react';
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
  InputAdornment,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import api from '@/services/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';

interface ServicePackageFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const validationSchema = yup.object({
  title: yup.string().required('Title is required').min(5).max(100),
  description: yup.string().required('Description is required').min(20).max(1000),
  category: yup.string().required('Category is required'),
  deliveryTime: yup.number().required('Delivery time is required').min(1).max(365),
  revisions: yup.number().required().min(0).max(20),
  features: yup.array().of(yup.string()).min(1, 'At least one feature is required'),
  skills: yup.array().of(yup.string()).min(1, 'At least one skill is required'),
});

const ServicePackageForm: React.FC<ServicePackageFormProps> = ({ 
  initialData, 
  onSuccess, 
  onCancel 
}) => {
  const isEditing = !!initialData?._id;
  
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

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || '',
        pricingType: initialData.pricing?.type || 'fixed',
        amount: initialData.pricing?.amount?.toString() || '',
        hourlyRate: initialData.pricing?.hourlyRate?.toString() || '',
        deliveryTime: initialData.deliveryTime?.toString() || '',
        revisions: initialData.revisions?.toString() || '2',
        features: initialData.features?.length > 0 ? initialData.features : [''],
        requirements: initialData.requirements?.length > 0 ? initialData.requirements : [''],
        skills: initialData.skills?.length > 0 ? initialData.skills : [''],
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
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
    if (array.length > 1) {
      array.splice(index, 1);
      setFormData({ ...formData, [field]: array });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      const validationData = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        deliveryTime: formData.deliveryTime ? parseInt(formData.deliveryTime) : undefined,
        revisions: formData.revisions ? parseInt(formData.revisions) : undefined,
        features: formData.features.filter(f => f.trim()),
        skills: formData.skills.filter(s => s.trim()),
      };

      await validationSchema.validate(validationData, { abortEarly: false });

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

      if (isEditing) {
        await api.patch(`/services/packages/${initialData._id}`, packageData);
        toast.success('Service package updated!');
      } else {
        await api.post('/services/packages', packageData);
        toast.success('Service package created!');
      }
      
      onSuccess?.();
    } catch (error: any) {
      if (error.inner) {
        const newErrors: Record<string, string> = {};
        error.inner.forEach((err: any) => {
          newErrors[err.path] = err.message;
        });
        setErrors(newErrors);
        toast.error('Please fix the validation errors');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save service package');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card elevation={0}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {isEditing ? 'Edit Service Package' : 'Create Service Package'}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Package Title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              error={!!errors.category}
              helperText={errors.category}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
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
                size="small"
                type="number"
                label="Fixed Price"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
          )}

          {formData.pricingType === 'hourly' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Hourly Rate"
                value={formData.hourlyRate}
                onChange={(e) => handleChange('hourlyRate', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
          )}

          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Delivery (days)"
              value={formData.deliveryTime}
              onChange={(e) => handleChange('deliveryTime', e.target.value)}
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Revisions"
              value={formData.revisions}
              onChange={(e) => handleChange('revisions', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>Features</Typography>
            {formData.features.map((feature, index) => (
              <Box key={index} display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  size="small"
                  value={feature}
                  onChange={(e) => handleArrayChange('features', index, e.target.value)}
                  placeholder="Enter feature"
                />
                <IconButton size="small" onClick={() => removeArrayItem('features', index)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button size="small" startIcon={<Add />} onClick={() => addArrayItem('features')}>
              Add Feature
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>Skills</Typography>
            {formData.skills.map((skill, index) => (
              <Box key={index} display="flex" gap={1} mb={1}>
                <TextField
                  fullWidth
                  size="small"
                  value={skill}
                  onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                  placeholder="Enter skill"
                />
                <IconButton size="small" onClick={() => removeArrayItem('skills', index)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button size="small" startIcon={<Add />} onClick={() => addArrayItem('skills')}>
              Add Skill
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
              {onCancel && <Button onClick={onCancel}>Cancel</Button>}
              <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ServicePackageForm;
