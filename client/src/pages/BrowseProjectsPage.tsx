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
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useProjects } from '@/hooks/api/useProjects';
import { useNavigate } from 'react-router-dom';

export const BrowseProjectsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('recent');

  const { data: projectsResponse, isLoading } = useProjects();

  const categories = ['Web Development', 'Mobile Apps', 'Design', 'Marketing', 'Writing', 'Data'];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // projectsResponse is PaginatedResponse<Project> with { data: Project[], pagination: {...} }
  const projects = Array.isArray(projectsResponse?.data) ? projectsResponse.data : [];
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      searchTerm === '' ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(project.category);

    return matchesSearch && matchesCategory && project.status === 'open';
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort By">
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="budget">Highest Budget</MenuItem>
                <MenuItem value="proposals">Fewest Proposals</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Category Filters */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filter by Category:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => {
                  setSelectedCategories((prev) =>
                    prev.includes(category)
                      ? prev.filter((c) => c !== category)
                      : [...prev, category]
                  );
                }}
                color={selectedCategories.includes(category) ? 'primary' : 'default'}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Projects Grid */}
      {!filteredProjects || filteredProjects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No projects found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} key={project._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {project.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {project.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {project.skills?.map((skill) => (
                      <Chip key={skill} label={skill} size="small" />
                    ))}
                  </Box>
                  <Typography variant="body2">
                    <strong>Budget:</strong> ${project.budget?.min} - ${project.budget?.max}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Timeline:</strong> {project.timeline?.duration}{' '}
                    {project.timeline?.unit}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate(`/dashboard/projects/${project._id}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
