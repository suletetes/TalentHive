import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Slider,
  Button,
  Collapse,
  IconButton,
  Grid,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useOrganizations } from '@/hooks/useOrganization';

const PROJECT_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Design & Creative',
  'Writing & Translation',
  'Digital Marketing',
  'Video & Animation',
  'Music & Audio',
  'Programming & Tech',
  'Business',
  'Data Science',
  'AI & Machine Learning',
  'DevOps & Cloud',
];

const COMMON_SKILLS = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
  'PHP', 'Laravel', 'Django', 'Ruby on Rails', 'Java', 'C#', '.NET',
  'iOS Development', 'Android Development', 'React Native', 'Flutter',
  'UI/UX Design', 'Graphic Design', 'Adobe Photoshop', 'Adobe Illustrator',
  'Figma', 'Sketch', 'WordPress', 'Shopify', 'Magento', 'WooCommerce',
];

interface ProjectFiltersProps {
  filters: {
    search: string;
    category: string;
    skills: string[];
    budgetType: string;
    budgetRange: [number, number];
    timeline: string;
    sortBy: string;
    sortOrder: string;
    featured: boolean;
    urgent: boolean;
    organization?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { data: organizationsData, isLoading: loadingOrganizations } = useOrganizations();
  const organizations = organizationsData?.data || [];

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleSkillsChange = (newSkills: string[]) => {
    handleFilterChange('skills', newSkills);
  };

  const handleBudgetRangeChange = (event: Event, newValue: number | number[]) => {
    handleFilterChange('budgetRange', newValue as [number, number]);
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.category ||
      filters.skills.length > 0 ||
      filters.budgetType ||
      filters.timeline ||
      filters.featured ||
      filters.urgent ||
      filters.organization ||
      filters.budgetRange[0] > 0 ||
      filters.budgetRange[1] < 10000
    );
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search projects..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
          }}
        />
      </Box>

      {/* Quick Filters */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          variant={filters.featured ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleFilterChange('featured', !filters.featured)}
        >
          Featured
        </Button>
        
        <Button
          variant={filters.urgent ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleFilterChange('urgent', !filters.urgent)}
        >
          Urgent
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          startIcon={<FilterList />}
          endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          onClick={() => setExpanded(!expanded)}
          variant="outlined"
          size="small"
        >
          Advanced Filters
        </Button>

        {hasActiveFilters() && (
          <Button
            startIcon={<Clear />}
            onClick={onClearFilters}
            variant="outlined"
            size="small"
            color="secondary"
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Advanced Filters */}
      <Collapse in={expanded}>
        <Grid container spacing={2}>
          {/* Category */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {PROJECT_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Budget Type */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Budget Type</InputLabel>
              <Select
                value={filters.budgetType}
                onChange={(e) => handleFilterChange('budgetType', e.target.value)}
                label="Budget Type"
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="fixed">Fixed Price</MenuItem>
                <MenuItem value="hourly">Hourly Rate</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Timeline */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Timeline</InputLabel>
              <Select
                value={filters.timeline}
                onChange={(e) => handleFilterChange('timeline', e.target.value)}
                label="Timeline"
              >
                <MenuItem value="">Any Timeline</MenuItem>
                <MenuItem value="1-days">Less than 1 day</MenuItem>
                <MenuItem value="7-days">Less than 1 week</MenuItem>
                <MenuItem value="1-months">Less than 1 month</MenuItem>
                <MenuItem value="3-months">Less than 3 months</MenuItem>
                <MenuItem value="6-months">Less than 6 months</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Sort By */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                label="Sort By"
              >
                <MenuItem value="createdAt-desc">Newest First</MenuItem>
                <MenuItem value="createdAt-asc">Oldest First</MenuItem>
                <MenuItem value="budget.max-desc">Highest Budget</MenuItem>
                <MenuItem value="budget.max-asc">Lowest Budget</MenuItem>
                <MenuItem value="viewCount-desc">Most Viewed</MenuItem>
                <MenuItem value="proposalCount-asc">Fewest Proposals</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Organization */}
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              options={organizations}
              getOptionLabel={(option: any) => option.name || ''}
              value={organizations.find((org: any) => org._id === filters.organization) || null}
              onChange={(event, newValue) => {
                handleFilterChange('organization', newValue?._id || '');
              }}
              loading={loadingOrganizations}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Organization"
                  placeholder="Filter by organization"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingOrganizations && <CircularProgress color="inherit" size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          {/* Skills */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={COMMON_SKILLS}
              value={filters.skills}
              onChange={(event, newValue) => handleSkillsChange(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Skills"
                  placeholder="Select skills"
                  size="small"
                />
              )}
            />
          </Grid>

          {/* Budget Range */}
          <Grid item xs={12} md={6}>
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" gutterBottom>
                Budget Range: ${filters.budgetRange[0]} - ${filters.budgetRange[1]}
                {filters.budgetType === 'hourly' && '/hr'}
              </Typography>
              <Slider
                value={filters.budgetRange}
                onChange={handleBudgetRangeChange}
                valueLabelDisplay="auto"
                min={0}
                max={10000}
                step={100}
                marks={[
                  { value: 0, label: '$0' },
                  { value: 2500, label: '$2.5K' },
                  { value: 5000, label: '$5K' },
                  { value: 7500, label: '$7.5K' },
                  { value: 10000, label: '$10K+' },
                ]}
              />
            </Box>
          </Grid>
        </Grid>
      </Collapse>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Active Filters:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {filters.category && (
              <Chip
                label={`Category: ${filters.category}`}
                size="small"
                onDelete={() => handleFilterChange('category', '')}
              />
            )}
            {filters.budgetType && (
              <Chip
                label={`Budget: ${filters.budgetType}`}
                size="small"
                onDelete={() => handleFilterChange('budgetType', '')}
              />
            )}
            {filters.timeline && (
              <Chip
                label={`Timeline: ${filters.timeline}`}
                size="small"
                onDelete={() => handleFilterChange('timeline', '')}
              />
            )}
            {filters.featured && (
              <Chip
                label="Featured"
                size="small"
                onDelete={() => handleFilterChange('featured', false)}
              />
            )}
            {filters.urgent && (
              <Chip
                label="Urgent"
                size="small"
                onDelete={() => handleFilterChange('urgent', false)}
              />
            )}
            {filters.organization && (
              <Chip
                label={`Organization: ${organizations.find((org: any) => org._id === filters.organization)?.name || 'Unknown'}`}
                size="small"
                onDelete={() => handleFilterChange('organization', '')}
              />
            )}
            {filters.skills.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                onDelete={() =>
                  handleSkillsChange(filters.skills.filter((s) => s !== skill))
                }
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};