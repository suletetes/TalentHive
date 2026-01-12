import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Grid,
  Fab,
} from '@mui/material';
import { Add, Edit, Delete, Launch, Close } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { ImageUpload } from './ImageUpload';
import { apiService } from '@/services/api';

interface PortfolioItem {
  _id: string;
  title: string;
  description: string;
  images: string[];
  projectUrl?: string;
  technologies: string[];
  completedAt: Date;
}

interface PortfolioManagerProps {
  portfolioItems: PortfolioItem[];
  isEditable?: boolean;
}

const portfolioSchema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  projectUrl: yup.string().url('Must be a valid URL').optional(),
  technologies: yup.array().of(yup.string()).min(1, 'At least one technology is required'),
  completedAt: yup.date().required('Completion date is required'),
});

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  portfolioItems,
  isEditable = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [techInput, setTechInput] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data: any) => apiService.post('/users/portfolio', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Portfolio item added successfully!');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add portfolio item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
      apiService.put(`/users/portfolio/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Portfolio item updated successfully!');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update portfolio item');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => apiService.delete(`/users/portfolio/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Portfolio item deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete portfolio item');
    },
  });

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      projectUrl: '',
      technologies: [] as string[],
      completedAt: new Date().toISOString().split('T')[0],
    },
    validationSchema: portfolioSchema,
    onSubmit: (values) => {
      const data = {
        ...values,
        images: uploadedImages,
        completedAt: new Date(values.completedAt),
      };

      if (editingItem) {
        updateMutation.mutate({ itemId: editingItem._id, data });
      } else {
        addMutation.mutate(data);
      }
    },
  });

  const handleOpenDialog = (item?: PortfolioItem) => {
    if (item) {
      setEditingItem(item);
      formik.setValues({
        title: item.title,
        description: item.description,
        projectUrl: item.projectUrl || '',
        technologies: item.technologies,
        completedAt: format(new Date(item.completedAt), 'yyyy-MM-dd'),
      });
      setUploadedImages(item.images);
    } else {
      setEditingItem(null);
      formik.resetForm();
      setUploadedImages([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    formik.resetForm();
    setUploadedImages([]);
    setTechInput('');
  };

  const handleAddTechnology = () => {
    if (techInput.trim() && !formik.values.technologies.includes(techInput.trim())) {
      formik.setFieldValue('technologies', [...formik.values.technologies, techInput.trim()]);
      setTechInput('');
    }
  };

  const handleRemoveTechnology = (tech: string) => {
    formik.setFieldValue(
      'technologies',
      formik.values.technologies.filter(t => t !== tech)
    );
  };

  const handleImageUpload = (urls: string[]) => {
    setUploadedImages(prev => [...prev, ...urls]);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Portfolio ({portfolioItems.length})
        </Typography>
        {isEditable && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Project
          </Button>
        )}
      </Box>

      {portfolioItems.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No portfolio items yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditable 
                ? 'Add your first project to showcase your work'
                : 'This freelancer hasn\'t added any portfolio items yet'
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {portfolioItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {item.images.length > 0 && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.images[0]}
                    alt={item.title}
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                    <Typography variant="h6" component="h3">
                      {item.title}
                    </Typography>
                    {isEditable && (
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => deleteMutation.mutate(item._id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {item.description}
                  </Typography>

                  <Box mb={2}>
                    {item.technologies.map((tech) => (
                      <Chip
                        key={tech}
                        label={tech}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Completed: {format(new Date(item.completedAt), 'MMM yyyy')}
                  </Typography>

                  {item.projectUrl && (
                    <Box mt={1}>
                      <Button
                        size="small"
                        startIcon={<Launch />}
                        href={item.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Project
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
            <IconButton onClick={handleCloseDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              name="title"
              label="Project Title"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
              margin="normal"
            />

            <TextField
              fullWidth
              name="description"
              label="Description"
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
              margin="normal"
            />

            <TextField
              fullWidth
              name="projectUrl"
              label="Project URL (Optional)"
              value={formik.values.projectUrl}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.projectUrl && Boolean(formik.errors.projectUrl)}
              helperText={formik.touched.projectUrl && formik.errors.projectUrl}
              margin="normal"
            />

            <TextField
              fullWidth
              name="completedAt"
              label="Completion Date"
              type="date"
              value={formik.values.completedAt}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.completedAt && Boolean(formik.errors.completedAt)}
              helperText={formik.touched.completedAt && formik.errors.completedAt}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />

            {/* Technologies */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Technologies Used
              </Typography>
              <Box display="flex" gap={1} mb={1}>
                <TextField
                  size="small"
                  placeholder="Add technology"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTechnology();
                    }
                  }}
                />
                <Button onClick={handleAddTechnology}>Add</Button>
              </Box>
              <Box>
                {formik.values.technologies.map((tech) => (
                  <Chip
                    key={tech}
                    label={tech}
                    onDelete={() => handleRemoveTechnology(tech)}
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Box>

            {/* Image Upload */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Project Images
              </Typography>
              <ImageUpload
                onUpload={handleImageUpload}
                multiple
                maxFiles={5}
                existingImages={uploadedImages}
                folder="portfolio"
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={() => formik.handleSubmit()}
            variant="contained"
            disabled={addMutation.isPending || updateMutation.isPending}
          >
            {editingItem ? 'Update' : 'Add'} Project
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};