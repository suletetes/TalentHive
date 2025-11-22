import React, { useState } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Chip,
  Typography,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/ToastProvider';
import { useOrganizations } from '@/hooks/useOrganization';

interface BasicInfoStepProps {
  formik: any;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ formik }) => {
  const [skillInput, setSkillInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch organizations
  const { data: organizationsData, isLoading: loadingOrganizations } = useOrganizations();

  // Fetch categories
  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiService.get('/categories');
      return response.data.data;
    },
  });

  // Fetch skills
  const { data: skillsData, isLoading: loadingSkills } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const response = await apiService.get('/skills');
      return response.data.data;
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiService.post('/categories', { name });
      return response.data.data;
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      formik.setFieldValue('category', newCategory._id);
      toast.success('Category created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create category');
    },
  });

  // Create skill mutation
  const createSkillMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiService.post('/skills', { name });
      return response.data.data;
    },
    onSuccess: (newSkill) => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      handleSkillAdd(newSkill._id);
      toast.success('Skill created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create skill');
    },
  });

  const categories = categoriesData || [];
  const skills = skillsData || [];
  const organizations = organizationsData?.data || [];

  const handleSkillAdd = (skillId: string) => {
    if (skillId && !formik.values.skills.includes(skillId)) {
      formik.setFieldValue('skills', [...formik.values.skills, skillId]);
      setSkillInput(''); // Clear input after adding
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    formik.setFieldValue(
      'skills',
      formik.values.skills.filter((skill: string) => skill !== skillToRemove)
    );
  };

  const handleCategoryChange = (event: any, newValue: any) => {
    if (typeof newValue === 'string') {
      // User typed a new category
      if (newValue.trim()) {
        createCategoryMutation.mutate(newValue.trim());
      }
    } else if (newValue && newValue.inputValue) {
      // User selected "Add new category"
      createCategoryMutation.mutate(newValue.inputValue);
    } else if (newValue) {
      // User selected an existing category
      formik.setFieldValue('category', newValue._id);
    } else {
      // User cleared the selection
      formik.setFieldValue('category', '');
    }
  };

  const handleSkillChange = (event: any, newValue: any) => {
    if (typeof newValue === 'string') {
      // User typed a new skill
      if (newValue.trim()) {
        createSkillMutation.mutate(newValue.trim());
      }
    } else if (newValue && newValue.inputValue) {
      // User selected "Add new skill"
      createSkillMutation.mutate(newValue.inputValue);
    } else if (newValue) {
      // User selected an existing skill
      handleSkillAdd(newValue._id);
    }
    setSkillInput(''); // Clear input after selection
  };

  const getSelectedCategory = () => {
    return categories.find((cat: any) => cat._id === formik.values.category) || null;
  };

  const getSkillName = (skillId: string) => {
    const skill = skills.find((s: any) => s._id === skillId);
    return skill ? skill.name : skillId;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Basic Project Information
      </Typography>

      <TextField
        fullWidth
        name="title"
        label="Project Title"
        value={formik.values.title}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.title && Boolean(formik.errors.title)}
        helperText={formik.touched.title && formik.errors.title}
        margin="normal"
        placeholder="e.g., Build a responsive e-commerce website"
      />

      <TextField
        fullWidth
        name="description"
        label="Project Description"
        multiline
        rows={6}
        value={formik.values.description}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.description && Boolean(formik.errors.description)}
        helperText={formik.touched.description && formik.errors.description}
        margin="normal"
        placeholder="Describe your project in detail. Include what you need, your goals, and any specific requirements..."
      />

      <Box sx={{ mt: 2 }}>
        <Autocomplete
          freeSolo
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          options={categories}
          getOptionLabel={(option: any) => {
            if (typeof option === 'string') {
              return option;
            }
            if (option.inputValue) {
              return option.inputValue;
            }
            return option.name || '';
          }}
          value={getSelectedCategory()}
          onChange={handleCategoryChange}
          onInputChange={(event, newInputValue) => {
            setCategoryInput(newInputValue);
          }}
          filterOptions={(options, params) => {
            const filtered = options.filter((option: any) =>
              option.name.toLowerCase().includes(params.inputValue.toLowerCase())
            );

            const { inputValue } = params;
            const isExisting = options.some((option: any) => inputValue === option.name);
            if (inputValue !== '' && !isExisting) {
              filtered.push({
                inputValue,
                name: `Add "${inputValue}"`,
              });
            }

            return filtered;
          }}
          loading={loadingCategories || createCategoryMutation.isPending}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Category"
              placeholder="Select or create a category"
              error={formik.touched.category && Boolean(formik.errors.category)}
              helperText={formik.touched.category && formik.errors.category}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {(loadingCategories || createCategoryMutation.isPending) && (
                      <CircularProgress color="inherit" size={20} />
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Required Skills
        </Typography>
        <Autocomplete
          freeSolo
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          options={skills}
          getOptionLabel={(option: any) => {
            if (typeof option === 'string') {
              return option;
            }
            if (option.inputValue) {
              return option.inputValue;
            }
            return option.name || '';
          }}
          value={null}
          inputValue={skillInput}
          onInputChange={(event, newInputValue) => {
            setSkillInput(newInputValue);
          }}
          onChange={handleSkillChange}
          filterOptions={(options, params) => {
            const filtered = options.filter((option: any) =>
              option.name.toLowerCase().includes(params.inputValue.toLowerCase())
            );

            const { inputValue } = params;
            const isExisting = options.some((option: any) => inputValue === option.name);
            if (inputValue !== '' && !isExisting) {
              filtered.push({
                inputValue,
                name: `Add "${inputValue}"`,
              });
            }

            return filtered;
          }}
          loading={loadingSkills || createSkillMutation.isPending}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Type to search or create skills"
              variant="outlined"
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {(loadingSkills || createSkillMutation.isPending) && (
                      <CircularProgress color="inherit" size={20} />
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {formik.values.skills.map((skillId: string) => (
            <Chip
              key={skillId}
              label={getSkillName(skillId)}
              onDelete={() => handleSkillRemove(skillId)}
              size="small"
            />
          ))}
        </Box>

        {formik.touched.skills && formik.errors.skills && (
          <FormHelperText error sx={{ mt: 1 }}>
            {formik.errors.skills}
          </FormHelperText>
        )}
      </Box>

      <Box sx={{ mt: 3 }}>
        <Autocomplete
          options={organizations}
          getOptionLabel={(option: any) => option.name || ''}
          value={organizations.find((org: any) => org._id === formik.values.organization) || null}
          onChange={(event, newValue) => {
            formik.setFieldValue('organization', newValue?._id || '');
          }}
          loading={loadingOrganizations}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Organization (Optional)"
              placeholder="Select an organization to link this project"
              helperText="Link this project to an organization for budget tracking"
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
      </Box>
    </Box>
  );
};
