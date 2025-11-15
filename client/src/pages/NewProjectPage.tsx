import { Container, Typography, Paper } from '@mui/material';
import { ProjectForm } from '@/components/projects/ProjectForm';

export const NewProjectPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Post a New Project
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Fill in the details below to post your project and start receiving proposals
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <ProjectForm />
      </Paper>
    </Container>
  );
};
