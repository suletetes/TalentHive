import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Grid,
  Button,
  IconButton,
} from '@mui/material';
import { Schedule, AttachMoney, Visibility, Flag, Edit } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

interface ReviewStepProps {
  formik: any;
  onEditStep?: (step: number) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ formik, onEditStep }) => {
  const { values } = formik;

  // Fetch categories to display names
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiService.get('/categories');
      return response.data.data;
    },
  });

  // Fetch skills to display names
  const { data: skillsData } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const response = await apiService.get('/skills');
      return response.data.data;
    },
  });

  const categories = categoriesData || [];
  const skills = skillsData || [];

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: any) => cat._id === categoryId);
    return category ? category.name : categoryId;
  };

  const getSkillName = (skillId: string) => {
    const skill = skills.find((s: any) => s._id === skillId);
    return skill ? skill.name : skillId;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Project
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Please review all the details before creating your project. You can go back to edit any section.
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6">
                  Basic Information
                </Typography>
                {onEditStep && (
                  <IconButton size="small" onClick={() => onEditStep(0)} color="primary">
                    <Edit fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Typography variant="h5" gutterBottom>
                {values.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Category: {getCategoryName(values.category)}
              </Typography>
              <Typography variant="body1" paragraph>
                {values.description}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Required Skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {values.skills.map((skillId: string) => (
                    <Chip key={skillId} label={getSkillName(skillId)} size="small" />
                  ))}
                </Box>
              </Box>

              {values.tags && values.tags.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {values.tags.map((tag: string) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Budget & Timeline */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney />
                  Budget
                </Typography>
                {onEditStep && (
                  <IconButton size="small" onClick={() => onEditStep(1)} color="primary">
                    <Edit fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Typography variant="body1">
                Type: {values.budget.type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
              </Typography>
              <Typography variant="h5" color="primary">
                ${values.budget.min} - ${values.budget.max}
                {values.budget.type === 'hourly' && '/hr'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule />
                  Timeline
                </Typography>
                {onEditStep && (
                  <IconButton size="small" onClick={() => onEditStep(1)} color="primary">
                    <Edit fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Typography variant="h5" color="primary">
                {values.timeline.duration} {values.timeline.unit}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Requirements & Deliverables */}
        {(values.requirements?.length > 0 || values.deliverables?.length > 0) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6">
                    Requirements & Deliverables
                  </Typography>
                  {onEditStep && (
                    <IconButton size="small" onClick={() => onEditStep(2)} color="primary">
                      <Edit fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                
                <Grid container spacing={2}>
                  {values.requirements?.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Requirements
                      </Typography>
                      <List dense>
                        {values.requirements.map((requirement: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemText primary={`• ${requirement}`} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  )}

                  {values.deliverables?.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Deliverables
                      </Typography>
                      <List dense>
                        {values.deliverables.map((deliverable: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemText primary={`• ${deliverable}`} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Additional Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6">
                  Project Settings
                </Typography>
                {onEditStep && (
                  <IconButton size="small" onClick={() => onEditStep(2)} color="primary">
                    <Edit fontSize="small" />
                  </IconButton>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Visibility fontSize="small" />
                <Typography>
                  Visibility: {values.visibility === 'public' ? 'Public' : 'Invite Only'}
                </Typography>
              </Box>

              {values.isUrgent && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Flag fontSize="small" color="warning" />
                  <Typography color="warning.main">
                    Marked as Urgent
                  </Typography>
                </Box>
              )}

              {values.applicationDeadline && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Schedule fontSize="small" />
                  <Typography>
                    Application Deadline: {new Date(values.applicationDeadline).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Once you publish this project, it will be visible to freelancers who can then submit proposals. 
          You can also save it as a draft to continue editing later.
        </Typography>
      </Box>
    </Box>
  );
};
