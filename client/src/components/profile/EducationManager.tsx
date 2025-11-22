import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Education {
  _id?: string;
  degree: string;
  institution: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface EducationManagerProps {
  education: Education[];
  isEditable: boolean;
}

export const EducationManager: React.FC<EducationManagerProps> = ({ education, isEditable }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Education>({
    degree: '',
    institution: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: { education: Education[] }) =>
      apiService.put('/users/profile', { freelancerProfile: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Education updated successfully!');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to update education');
    },
  });

  const handleOpenDialog = (index: number | null = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setFormData(education[index]);
    } else {
      setEditingIndex(null);
      setFormData({
        degree: '',
        institution: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingIndex(null);
  };

  const handleSave = () => {
    const updatedEducation = [...education];
    if (editingIndex !== null) {
      updatedEducation[editingIndex] = formData;
    } else {
      updatedEducation.push(formData);
    }
    updateMutation.mutate({ education: updatedEducation });
  };

  const handleDelete = (index: number) => {
    const updatedEducation = education.filter((_, i) => i !== index);
    updateMutation.mutate({ education: updatedEducation });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Education</Typography>
        {isEditable && (
          <Button startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Education
          </Button>
        )}
      </Box>

      {education.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No education added yet
        </Typography>
      ) : (
        <List>
          {education.map((edu, index) => (
            <Box key={edu._id || index}>
              <ListItem
                alignItems="flex-start"
                sx={{ px: 0 }}
                secondaryAction={
                  isEditable && (
                    <Box>
                      <IconButton onClick={() => handleOpenDialog(index)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )
                }
              >
                <ListItemText
                  primary={
                    <Typography variant="h6" component="div">
                      {edu.degree}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body1" color="text.primary" component="div">
                        {edu.institution}
                        {edu.fieldOfStudy && ` • ${edu.fieldOfStudy}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="div">
                        {format(new Date(edu.startDate), 'MMM yyyy')} -{' '}
                        {edu.endDate ? format(new Date(edu.endDate), 'MMM yyyy') : 'Present'}
                      </Typography>
                      {edu.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {edu.description}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
              {index < education.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Education</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Degree"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Institution"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Field of Study"
                value={formData.fieldOfStudy}
                onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="month"
                value={formData.startDate ? formData.startDate.substring(0, 7) : ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value + '-01' })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date (Leave empty if ongoing)"
                type="month"
                value={formData.endDate ? formData.endDate.substring(0, 7) : ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value + '-01' })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.degree || !formData.institution || !formData.startDate}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
