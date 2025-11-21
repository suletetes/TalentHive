import { useState } from 'react';
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
  Button,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Refresh } from '@mui/icons-material';
import { FreelancerCard } from '@/components/profile/FreelancerCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useFreelancers } from '@/hooks/api/useUsers';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { ErrorHandler } from '@/utils/errorHandler';

export const FreelancersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('rating');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 12;

  // Fetch skills from database
  const { data: skillsData } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const response = await apiService.get('/skills');
      return response.data.data;
    },
  });

  const skills = skillsData || [];

  // Fetch freelancers with filters
  const {
    data: freelancersResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useFreelancers({
    skills: selectedSkills.length > 0 ? selectedSkills : undefined,
    search: searchTerm || undefined,
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

  const handleSkillToggle = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-');
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSkills([]);
    setSortBy('rating');
    setSortOrder('desc');
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
            Failed to load freelancers
          </Typography>
          <Typography variant="body2">{apiError.message}</Typography>
        </Alert>
      </Container>
    );
  }

  const freelancers = freelancersResponse?.data || [];
  const pagination = freelancersResponse?.pagination;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Find Freelancers
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Browse talented freelancers and hire the perfect match for your project
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search freelancers by name or skills..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
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
                <MenuItem value="rating-desc">Highest Rated</MenuItem>
                <MenuItem value="rating-asc">Lowest Rated</MenuItem>
                <MenuItem value="createdAt-desc">Most Recent</MenuItem>
                <MenuItem value="createdAt-asc">Oldest First</MenuItem>
                <MenuItem value="rating.count-desc">Most Reviews</MenuItem>
                <MenuItem value="freelancerProfile.hourlyRate-asc">Lowest Rate</MenuItem>
                <MenuItem value="freelancerProfile.hourlyRate-desc">Highest Rate</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              sx={{ height: '56px' }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>

        {/* Skill Filters */}
        {skills.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filter by Skills:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {skills.map((skill: any) => (
                <Chip
                  key={skill._id}
                  label={skill.name}
                  onClick={() => handleSkillToggle(skill._id)}
                  color={selectedSkills.includes(skill._id) ? 'primary' : 'default'}
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
            {pagination.total} freelancers
          </Typography>
        </Box>
      )}

      {/* Freelancers Grid */}
      {freelancers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            No freelancers found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Try adjusting your search criteria or check back later
          </Typography>
          <Button variant="outlined" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {freelancers.map((freelancer: any) => (
              <Grid item xs={12} sm={6} md={4} key={freelancer._id}>
                <FreelancerCard freelancer={freelancer} />
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
