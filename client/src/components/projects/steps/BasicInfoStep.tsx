import React, { useState } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Chip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

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
  'SEO', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Social Media',
  'Video Editing', 'After Effects', 'Premiere Pro', 'Animation',
  'Data Analysis', 'Machine Learning', 'TensorFlow', 'PyTorch',
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes',
];

interface BasicInfoStepProps {
  formik: any;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ formik }) => {
  const [skillInput, setSkillInput] = useState('');

  const handleSkillAdd = (skill: string) => {
    if (skill && !formik.values.skills.includes(skill)) {
      formik.setFieldValue('skills', [...formik.values.skills, skill]);
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    formik.setFieldValue(
      'skills',
      formik.values.skills.filter((skill: string) => skill !== skillToRemove)
    );
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

      <FormControl fullWidth margin="normal">
        <InputLabel>Category</InputLabel>
        <Select
          name="category"
          value={formik.values.category}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.category && Boolean(formik.errors.category)}
          label="Category"
        >
          {PROJECT_CATEGORIES.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Required Skills
        </Typography>
        <Autocomplete
          freeSolo
          options={COMMON_SKILLS}
          value={skillInput}
          onInputChange={(event, newValue) => setSkillInput(newValue)}
          onChange={(event, newValue) => {
            if (newValue) {
              handleSkillAdd(newValue);
              setSkillInput('');
            }
          }}
          onKeyPress={(event) => {
            if (event.key === 'Enter' && skillInput.trim()) {
              event.preventDefault();
              handleSkillAdd(skillInput.trim());
              setSkillInput('');
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Type and press Enter to add skills"
              variant="outlined"
              size="small"
            />
          )}
        />
        
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {formik.values.skills.map((skill: string) => (
            <Chip
              key={skill}
              label={skill}
              onDelete={() => handleSkillRemove(skill)}
              size="small"
            />
          ))}
        </Box>
        
        {formik.touched.skills && formik.errors.skills && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            {formik.errors.skills}
          </Typography>
        )}
      </Box>
    </Box>
  );
};