import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, AttachMoney } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiService } from '@/services/api';

interface Skill {
  skill: string;
  rate?: number;
}

interface SkillsManagerProps {
  skills: string[];
  skillRates?: Skill[];
  isEditable?: boolean;
}

export const SkillsManager: React.FC<SkillsManagerProps> = ({
  skills,
  skillRates = [],
  isEditable = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newRate, setNewRate] = useState('');
  const queryClient = useQueryClient();

  const addSkillMutation = useMutation({
    mutationFn: (data: { skill: string; rate?: number }) =>
      apiService.post('/users/skills', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Skill added successfully!');
      setDialogOpen(false);
      setNewSkill('');
      setNewRate('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add skill');
    },
  });

  const removeSkillMutation = useMutation({
    mutationFn: (skill: string) =>
      apiService.delete(`/users/skills/${encodeURIComponent(skill)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Skill removed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove skill');
    },
  });

  const handleAddSkill = () => {
    if (!newSkill.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    const data: { skill: string; rate?: number } = {
      skill: newSkill.trim(),
    };

    if (newRate && parseFloat(newRate) > 0) {
      data.rate = parseFloat(newRate);
    }

    addSkillMutation.mutate(data);
  };

  const getSkillRate = (skill: string): number | undefined => {
    const skillRate = skillRates.find(sr => sr.skill === skill);
    return skillRate?.rate;
  };

  const formatRate = (rate: number | undefined): string => {
    return rate ? `$${rate}/hr` : '';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Skills ({skills.length})
        </Typography>
        {isEditable && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
          >
            Add Skill
          </Button>
        )}
      </Box>

      {skills.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {isEditable ? 'Add your skills to showcase your expertise' : 'No skills listed'}
        </Typography>
      ) : (
        <Grid container spacing={1}>
          {skills.map((skill) => {
            const rate = getSkillRate(skill);
            return (
              <Grid item key={skill}>
                <Box position="relative">
                  <Chip
                    label={
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <span>{skill}</span>
                        {rate && (
                          <Box
                            component="span"
                            sx={{
                              fontSize: '0.75rem',
                              opacity: 0.8,
                              ml: 0.5,
                            }}
                          >
                            ${rate}/hr
                          </Box>
                        )}
                      </Box>
                    }
                    variant={rate ? 'filled' : 'outlined'}
                    color={rate ? 'primary' : 'default'}
                    onDelete={
                      isEditable
                        ? () => removeSkillMutation.mutate(skill)
                        : undefined
                    }
                    deleteIcon={
                      isEditable ? (
                        <Delete fontSize="small" />
                      ) : undefined
                    }
                    sx={{
                      '& .MuiChip-label': {
                        display: 'flex',
                        alignItems: 'center',
                      },
                    }}
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add Skill Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Skill</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Skill Name"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            margin="normal"
            placeholder="e.g., React, Node.js, Graphic Design"
            autoFocus
          />
          <TextField
            fullWidth
            label="Hourly Rate (Optional)"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            margin="normal"
            type="number"
            placeholder="0"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  /hour
                </InputAdornment>
              ),
            }}
            helperText="Set a specific rate for this skill (optional)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddSkill}
            variant="contained"
            disabled={addSkillMutation.isPending}
          >
            Add Skill
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};