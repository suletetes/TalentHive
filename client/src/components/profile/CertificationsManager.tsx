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
  Link as MuiLink,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, OpenInNew } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Certification {
  _id?: string;
  name: string;
  issuer: string;
  dateEarned: string;
  verificationUrl?: string;
}

interface CertificationsManagerProps {
  certifications: Certification[];
  isEditable: boolean;
}

export const CertificationsManager: React.FC<CertificationsManagerProps> = ({
  certifications,
  isEditable,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Certification>({
    name: '',
    issuer: '',
    dateEarned: '',
    verificationUrl: '',
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: { certifications: Certification[] }) =>
      apiService.put('/users/profile', { freelancerProfile: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Certifications updated successfully!');
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to update certifications');
    },
  });

  const handleOpenDialog = (index: number | null = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setFormData(certifications[index]);
    } else {
      setEditingIndex(null);
      setFormData({
        name: '',
        issuer: '',
        dateEarned: '',
        verificationUrl: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingIndex(null);
  };

  const handleSave = () => {
    const updatedCertifications = [...certifications];
    if (editingIndex !== null) {
      updatedCertifications[editingIndex] = formData;
    } else {
      updatedCertifications.push(formData);
    }
    updateMutation.mutate({ certifications: updatedCertifications });
  };

  const handleDelete = (index: number) => {
    const updatedCertifications = certifications.filter((_, i) => i !== index);
    updateMutation.mutate({ certifications: updatedCertifications });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Certifications</Typography>
        {isEditable && (
          <Button startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Certification
          </Button>
        )}
      </Box>

      {certifications.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No certifications added yet
        </Typography>
      ) : (
        <List>
          {certifications.map((cert, index) => (
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
                primary={cert.name}
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="span" display="block">
                      {cert.issuer} • {format(new Date(cert.dateEarned), 'MMM yyyy')}
                    </Typography>
                    {cert.verificationUrl && (
                      <MuiLink
                        href={cert.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                      >
                        Verify <OpenInNew fontSize="small" />
                      </MuiLink>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Certification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Certification Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Issuing Organization"
                value={formData.issuer}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date Earned"
                type="month"
                value={formData.dateEarned ? formData.dateEarned.substring(0, 7) : ''}
                onChange={(e) => setFormData({ ...formData, dateEarned: e.target.value + '-01' })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Verification URL (Optional)"
                value={formData.verificationUrl}
                onChange={(e) => setFormData({ ...formData, verificationUrl: e.target.value })}
                placeholder="https://..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || !formData.issuer || !formData.dateEarned}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
