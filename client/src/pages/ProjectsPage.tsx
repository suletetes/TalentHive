import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
} from '@mui/material';
import { Add, Close, Refresh } from '@mui/icons-material';
import { useSelector } from 'react-redux';

import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { PageLoading, GridSkeleton } from '@/components/ui/LoadingStates';
import { RootState } from '@/store';
import { useMyProjects } from '@/hooks/api/useProjects';
import { ErrorHandler } from '@/utils/errorHandler';

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
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const { user } = useSelector((state: RootState) => state.auth);
  const isClient = user?.role === 'client';

  // Debounce filter changes (500ms)
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filters]);

  const {
    data: projectsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMyProjects();

  const projects = projectsData?.data || [];
  const pagination = null; // My projects doesn't have pagination

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
    refetch();
  };

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return <PageLoading message="Loading projects..." />;
  }

  if (isError) {
    const apiError = ErrorHandler.handle(error);
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<Refresh />}
              onClick={handleRetry}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            Failed to load projects
          </Typography>
          <Typography variant="body2">{apiError.message}</Typography>
        </Alert>
      </Container>
    );
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
      {isFetching && !isLoading ? (
        <Box sx={{ position: 'relative', minHeight: 400 }}>
          <GridSkeleton items={6} columns={3} height={250} />
        </Box>
      ) : projects.length === 0 ? (
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
                disabled={isFetching}
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