import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Pagination,
  Alert,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Refresh } from '@mui/icons-material';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { useProjects } from '@/hooks/api/useProjects';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { ErrorHandler } from '@/utils/errorHandler';

export const BrowseProjectsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 12;
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Debounce search term (500ms)
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm]);

  // Fetch categories from database
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // apiService.get returns response.data directly
      const response: any = await apiService.get('/categories');
      const categories = response?.data?.categories || response?.categories || response?.data || response || [];
      return Array.isArray(categories) ? categories : [];
    },
  });

  const categories = categoriesData || [];

  // Fetch projects with filters
  const {
    data: projectsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useProjects({
    search: debouncedSearchTerm,
    category: selectedCategory,
    status: 'open', // Only show open projects (not drafts)
    sortBy,
    sortOrder,
    page,
    limit,
  });

  const handleRetry = () => {
    refetch();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? '' : categoryId);
    setPage(1); // Reset to first page when filter changes
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-');
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  if (isLoading) {
    return <LoadingSpinner />;
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

  const projects = projectsResponse?.data || [];
  const pagination = projectsResponse?.pagination;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Browse Projects
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Find projects that match your skills and start earning
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => handleSortChange(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="createdAt-desc">Most Recent</MenuItem>
                <MenuItem value="createdAt-asc">Oldest First</MenuItem>
                <MenuItem value="budget.max-desc">Highest Budget</MenuItem>
                <MenuItem value="budget.max-asc">Lowest Budget</MenuItem>
                <MenuItem value="proposalCount-asc">Fewest Proposals</MenuItem>
                <MenuItem value="proposalCount-desc">Most Proposals</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSortBy('createdAt');
                setSortOrder('desc');
                setPage(1);
              }}
              sx={{ height: { xs: '48px', sm: '56px' } }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>

        {/* Category Filters */}
        {categories.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filter by Category:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {categories.map((category: any) => (
                <Chip
                  key={category._id}
                  label={category.name}
                  onClick={() => handleCategoryToggle(category._id)}
                  color={selectedCategory === category._id ? 'primary' : 'default'}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {/* Results Summary */}
      {pagination && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {((pagination.page - 1) * pagination.limit) + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} projects
          </Typography>
        </Box>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            No projects found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Try adjusting your search criteria or check back later for new projects
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {projects.map((project: any) => (
              <Grid item xs={12} sm={6} lg={4} key={project._id}>
                <ProjectCard project={project} showBookmark={true} />
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
    </Container>
  );
};

export default BrowseProjectsPage;
