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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { FreelancerCard } from '@/components/profile/FreelancerCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useFreelancers } from '@/hooks/api/useUsers';

export const FreelancersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('rating');

  const { data: freelancersResponse, isLoading } = useFreelancers({
    skills: selectedSkills.length > 0 ? selectedSkills : undefined,
    search: searchTerm || undefined,
  });

  const freelancers = Array.isArray(freelancersResponse?.data) ? freelancersResponse.data : [];

  const skills = ['JavaScript', 'React', 'Node.js', 'Python', 'Design', 'Marketing'];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
                <MenuItem value="rating">Highest Rated</MenuItem>
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="reviews">Most Reviews</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Skill Filters */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filter by Skills:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {skills.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                onClick={() => {
                  setSelectedSkills((prev) =>
                    prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
                  );
                }}
                color={selectedSkills.includes(skill) ? 'primary' : 'default'}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Freelancers Grid */}
      {freelancers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No freelancers found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {freelancers.map((freelancer) => (
            <Grid item xs={12} sm={6} md={4} key={freelancer._id}>
              <FreelancerCard freelancer={freelancer} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
