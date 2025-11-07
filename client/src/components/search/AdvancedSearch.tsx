import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Autocomplete,
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';

interface AdvancedSearchProps {
  type: 'projects' | 'freelancers';
  onSearch: (filters: any) => void;
}

const PROJECT_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Design',
  'Writing',
  'Marketing',
  'Data Science',
];

const COMMON_SKILLS = [
  'JavaScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'PHP',
  'Design',
  'Writing',
];

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ type, onSearch }) => {
  const [filters, setFilters] = useState<any>({
    q: '',
    category: '',
    skills: [],
    budgetMin: '',
    budgetMax: '',
    budgetType: '',
    minRating: '',
    hourlyRateMin: '',
    hourlyRateMax: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== '' && (Array.isArray(v) ? v.length > 0 : true))
    );
    onSearch(cleanFilters);
  };

  const handleReset = () => {
    setFilters({
      q: '',
      category: '',
      skills: [],
      budgetMin: '',
      budgetMax: '',
      budgetType: '',
      minRating: '',
      hourlyRateMin: '',
      hourlyRateMax: '',
    });
    onSearch({});
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Search"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder={type === 'projects' ? 'Search projects...' : 'Search freelancers...'}
            />
          </Grid>

          {type === 'projects' && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {PROJECT_CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Budget Type</InputLabel>
                  <Select
                    value={filters.budgetType}
                    onChange={(e) => setFilters({ ...filters, budgetType: e.target.value })}
                    label="Budget Type"
                  >
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="fixed">Fixed Price</MenuItem>
                    <MenuItem value="hourly">Hourly Rate</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Min Budget"
                  type="number"
                  value={filters.budgetMin}
                  onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Budget"
                  type="number"
                  value={filters.budgetMax}
                  onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                />
              </Grid>
            </>
          )}

          {type === 'freelancers' && (
            <>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Min Rating"
                  type="number"
                  inputProps={{ min: 0, max: 5, step: 0.5 }}
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Min Hourly Rate"
                  type="number"
                  value={filters.hourlyRateMin}
                  onChange={(e) => setFilters({ ...filters, hourlyRateMin: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Hourly Rate"
                  type="number"
                  value={filters.hourlyRateMax}
                  onChange={(e) => setFilters({ ...filters, hourlyRateMax: e.target.value })}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={COMMON_SKILLS}
              value={filters.skills}
              onChange={(_, newValue) => setFilters({ ...filters, skills: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="Skills" placeholder="Select skills" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} key={option} />
                ))
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={handleReset} variant="outlined">
                Reset
              </Button>
              <Button type="submit" variant="contained" startIcon={<Search />}>
                Search
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};