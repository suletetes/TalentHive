import { Container, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ProjectForm } from '@/components/projects/ProjectForm';

export const NewProjectPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to my projects page after successful creation
    navigate('/dashboard/projects');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Post a New Project
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Fill in the details below to post your project and start receiving proposals
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <ProjectForm onSuccess={handleSuccess} />
      </Paper>
    </Container>
  );
};
