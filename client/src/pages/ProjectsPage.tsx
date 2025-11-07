import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RootState } from '@/store';
import { apiService } from '@/services/api';

export const ProjectsPage: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    skills: [],
    budgetType: '',
    budgetRange: [0, 10000] as [number, number],
    timeline: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    featured: false,
    urgent: false,
    page: 1,
    limit: 12,
  });

  const { user } = useSelector((state: RootState) => state.auth);
  const isClient = user?.role === 'client';

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== false && value !== 0) {
          if (key === 'skills' && Array.isArray(value) && value.length > 0) {
            params.append(key, value.join(','));
          } else if (key === 'budgetRange') {
            const [min, max] = value as [number, number];
            if (min > 0) params.append('budgetMin', min.toString());
            if (max < 10000) params.append('budgetMax', max.toString());
          } else if (key !== 'budgetRange') {
            params.append(key, value.toString());
          }
        }
      });

      return apiService.get(`/projects?${params.toString()}`);
    },
  });

  const projects = projectsData?.data?.data?.projects || [];
  const pagination = projectsData?.data?.data?.pagination;

  const handleFiltersChange = (newFilters: any) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      skills: [],
      budgetType: '',
      budgetRange: [0, 10000],
      timeline: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      featured: false,
      urgent: false,
      page: 1,
      limit: 12,
    });
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setFilters({ ...filters, page });
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Find Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover opportunities that match your skills
          </Typography>
        </Box>
        
        {isClient && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Post New Project
          </Button>
        )}
      </Box>

      {/* Filters */}
      <ProjectFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Results Summary */}
      {pagination && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} projects
          </Typography>
        </Box>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: 'grey.50',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            No projects found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Try adjusting your filters or search terms to find more projects.
          </Typography>
          <Button variant="outlined" onClick={handleClearFilters}>
            Clear All Filters
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {projects.map((project: any) => (
              <Grid item xs={12} sm={6} lg={4} key={project._id}>
                <ProjectCard
                  project={project}
                  showBookmark={!isClient}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Create Project Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Create New Project
            <IconButton onClick={() => setCreateDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <ProjectForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};