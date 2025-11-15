import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Paper, Chip, Button, Grid, Avatar } from '@mui/material';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useProject } from '@/hooks/api/useProjects';

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: projectResponse, isLoading, error } = useProject(id || '');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !projectResponse?.data) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          Project not found
        </Typography>
      </Container>
    );
  }

  const project = projectResponse.data;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {project.title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip label={project.category} color="primary" size="small" />
          <Chip label={project.status} color="secondary" size="small" />
        </Box>

        <Typography variant="h6" gutterBottom>
          Description
        </Typography>
        <Typography variant="body1" paragraph>
          {project.description}
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {project.budget && (
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Budget
              </Typography>
              <Typography variant="body1">
                ${project.budget.min} - ${project.budget.max} ({project.budget.type})
              </Typography>
            </Grid>
          )}

          {project.timeline && (
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Timeline
              </Typography>
              <Typography variant="body1">
                {project.timeline.duration} {project.timeline.unit}
              </Typography>
            </Grid>
          )}

          {project.skills && project.skills.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Required Skills
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {project.skills.map((skill) => (
                  <Chip key={skill} label={skill} variant="outlined" />
                ))}
              </Box>
            </Grid>
          )}

          {project.requirements && project.requirements.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Requirements
              </Typography>
              <Box component="ul">
                {project.requirements.map((req, index) => (
                  <li key={index}>
                    <Typography variant="body2">{req}</Typography>
                  </li>
                ))}
              </Box>
            </Grid>
          )}

          {project.client && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Client
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={project.client?.profile?.avatar}>
                  {project.client?.profile?.firstName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="body1">
                    {project.client?.profile?.firstName} {project.client?.profile?.lastName}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button variant="contained" size="large" fullWidth>
              Submit Proposal
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};
