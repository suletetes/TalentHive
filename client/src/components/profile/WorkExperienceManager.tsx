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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface WorkExperience {
  _id?: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

interface WorkExperienceManagerProps {
  workExperience: WorkExperience[];
  isEditable: boolean;
}

export const WorkExperienceManager: React.FC<WorkExperienceManagerProps> = ({
  workExperience,
  isEditable,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<WorkExperience>({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: { workExperience: WorkExperience[] }) =>
      apiService.put('/users/profile', { freelancerProfile: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Work experience updated successfully!');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to update work experience');
    },
  });

  const handleOpenDialog = (index: number | null = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setFormData(workExperience[index]);
    } else {
      setEditingIndex(null);
      setFormData({
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
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
    const updatedExperience = [...workExperience];
    if (editingIndex !== null) {
      updatedExperience[editingIndex] = formData;
    } else {
      updatedExperience.push(formData);
    }
    updateMutation.mutate({ workExperience: updatedExperience });
  };

  const handleDelete = (index: number) => {
    const updatedExperience = workExperience.filter((_, i) => i !== index);
    updateMutation.mutate({ workExperience: updatedExperience });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Work Experience</Typography>
        {isEditable && (
          <Button startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Experience
          </Button>
        )}
      </Box>

      {workExperience.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No work experience added yet
        </Typography>
      ) : (
        <List>
          {workExperience.map((exp, index) => (
            <Box key={exp._id || index}>
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
                      {exp.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body1" color="text.primary" component="div">
                        {exp.company}
                        {exp.location && ` • ${exp.location}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="div">
                        {format(new Date(exp.startDate), 'MMM yyyy')} -{' '}
                        {exp.current ? 'Present' : format(new Date(exp.endDate!), 'MMM yyyy')}
                      </Typography>
                      {exp.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {exp.description}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
              {index < workExperience.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Work Experience</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                label="End Date"
                type="month"
                value={formData.endDate ? formData.endDate.substring(0, 7) : ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value + '-01' })}
                InputLabelProps={{ shrink: true }}
                disabled={formData.current}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.current}
                    onChange={(e) =>
                      setFormData({ ...formData, current: e.target.checked, endDate: '' })
                    }
                  />
                }
                label="I currently work here"
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
            disabled={!formData.title || !formData.company || !formData.startDate}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
