import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { projectsService } from '@/services/api/projects.service';
import { ErrorState } from '@/components/ui/ErrorState';

export const EditProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch project data
  const { data: projectResponse, isLoading, error } = useQuery({
    queryKey: ['projects', 'detail', id],
    queryFn: () => projectsService.getProjectById(id!),
    enabled: !!id,
  });

  const project = projectResponse?.data;

  const handleSuccess = () => {
    navigate(`/dashboard/projects/${id}`);
  };

  const handleCancel = () => {
    navigate(`/dashboard/projects/${id}`);
  };

  // Transform project data for the form
  const getInitialData = () => {
    if (!project) return undefined;

    console.log('[EDIT PROJECT] Raw project data:', project);
    
    // Extract organization ID
    let organizationId = '';
    if (project.organization) {
      organizationId = typeof project.organization === 'object' && project.organization?._id
        ? project.organization._id
        : project.organization;
    }
    
    const transformedData = {
      ...project,
      // Extract category ID if it's an object
      category: typeof project.category === 'object' && project.category?._id 
        ? project.category._id 
        : project.category,
      // Extract skill IDs if they're objects
      skills: project.skills?.map((skill: any) => 
        typeof skill === 'object' && skill?._id ? skill._id : skill
      ) || [],
      // Only include organization if it has a value
      organization: organizationId || undefined,
    };

    console.log('[EDIT PROJECT] Transformed data:', transformedData);
    return transformedData;
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState 
          error={error} 
          onRetry={() => navigate(`/dashboard/projects/${id}`)} 
        />
      </Container>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Project not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 2,
            cursor: 'pointer',
            '&:hover': { opacity: 0.7 }
          }}
          onClick={() => navigate(`/dashboard/projects/${id}`)}
        >
          <ArrowBack />
          <Typography variant="body2" color="text.secondary">
            Back to Project
          </Typography>
        </Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Project
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Update your project details. Changes will be visible to freelancers immediately.
        </Typography>
      </Box>

      <ProjectForm 
        initialData={getInitialData()}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Container>
  );
};

export default EditProjectPage;
