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
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';

interface Language {
  language: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

interface LanguagesManagerProps {
  languages: Language[];
  isEditable: boolean;
}

export const LanguagesManager: React.FC<LanguagesManagerProps> = ({ languages, isEditable }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Language>({
    language: '',
    proficiency: 'conversational',
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: { languages: Language[] }) =>
      apiService.put('/users/profile', { freelancerProfile: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Languages updated successfully!');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to update languages');
    },
  });

  const handleOpenDialog = (index: number | null = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setFormData(languages[index]);
    } else {
      setEditingIndex(null);
      setFormData({
        language: '',
        proficiency: 'conversational',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingIndex(null);
  };

  const handleSave = () => {
    const updatedLanguages = [...languages];
    if (editingIndex !== null) {
      updatedLanguages[editingIndex] = formData;
    } else {
      updatedLanguages.push(formData);
    }
    updateMutation.mutate({ languages: updatedLanguages });
  };

  const handleDelete = (index: number) => {
    const updatedLanguages = languages.filter((_, i) => i !== index);
    updateMutation.mutate({ languages: updatedLanguages });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Languages</Typography>
        {isEditable && (
          <Button startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Language
          </Button>
        )}
      </Box>

      {languages.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No languages added yet
        </Typography>
      ) : (
        <List>
          {languages.map((lang, index) => (
            <ListItem
              key={index}
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
                primary={lang.language}
                secondary={lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Language</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Proficiency Level"
                value={formData.proficiency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    proficiency: e.target.value as Language['proficiency'],
                  })
                }
                required
              >
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="conversational">Conversational</MenuItem>
                <MenuItem value="fluent">Fluent</MenuItem>
                <MenuItem value="native">Native</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.language || !formData.proficiency}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
