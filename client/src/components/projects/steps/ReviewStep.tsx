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
  Divider,
} from '@mui/material';
import { Schedule, AttachMoney, Visibility, Flag } from '@mui/icons-material';

interface ReviewStepProps {
  formik: any;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ formik }) => {
  const { values } = formik;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Project
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Please review all the details before creating your project. You can edit these later if needed.
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {values.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Category: {values.category}
              </Typography>
              <Typography variant="body1" paragraph>
                {values.description}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Required Skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {values.skills.map((skill: string) => (
                    <Chip key={skill} label={skill} size="small" />
                  ))}
                </Box>
              </Box>

              {values.tags.length > 0 && (
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
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney />
                Budget
              </Typography>
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
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule />
                Timeline
              </Typography>
              <Typography variant="h5" color="primary">
                {values.timeline.duration} {values.timeline.unit}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Requirements & Deliverables */}
        {(values.requirements.length > 0 || values.deliverables.length > 0) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Requirements & Deliverables
                </Typography>
                
                <Grid container spacing={2}>
                  {values.requirements.length > 0 && (
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

                  {values.deliverables.length > 0 && (
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
              <Typography variant="h6" gutterBottom>
                Project Settings
              </Typography>
              
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
                    Application Deadline: {new Date(values.applicationDeadline).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
        <Typography variant="body2" color="info.main">
          <strong>Note:</strong> Once you create this project, it will be visible to freelancers who can then submit proposals. 
          You can edit the project details later, but some changes may not be possible once proposals are received.
        </Typography>
      </Box>
    </Box>
  );
};