import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Grid,
  InputAdornment,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import { AttachMoney, Schedule } from '@mui/icons-material';

interface BudgetTimelineStepProps {
  formik: any;
}

export const BudgetTimelineStep: React.FC<BudgetTimelineStepProps> = ({ formik }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Budget & Timeline
      </Typography>

      {/* Budget Section */}
      <Box sx={{ mb: 4 }}>
        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Budget Type</FormLabel>
          <RadioGroup
            row
            name="budget.type"
            value={formik.values.budget.type}
            onChange={formik.handleChange}
          >
            <FormControlLabel
              value="fixed"
              control={<Radio />}
              label="Fixed Price"
            />
            <FormControlLabel
              value="hourly"
              control={<Radio />}
              label="Hourly Rate"
            />
          </RadioGroup>
        </FormControl>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="budget.min"
              label={`Minimum ${formik.values.budget.type === 'fixed' ? 'Budget' : 'Rate'}`}
              type="number"
              value={formik.values.budget.min}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.budget?.min && Boolean(formik.errors.budget?.min)}
              helperText={formik.touched.budget?.min && formik.errors.budget?.min}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney />
                  </InputAdornment>
                ),
                endAdornment: formik.values.budget.type === 'hourly' && (
                  <InputAdornment position="end">/hr</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="budget.max"
              label={`Maximum ${formik.values.budget.type === 'fixed' ? 'Budget' : 'Rate'}`}
              type="number"
              value={formik.values.budget.max}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.budget?.max && Boolean(formik.errors.budget?.max)}
              helperText={formik.touched.budget?.max && formik.errors.budget?.max}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney />
                  </InputAdornment>
                ),
                endAdornment: formik.values.budget.type === 'hourly' && (
                  <InputAdornment position="end">/hr</InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        {formik.values.budget.type === 'fixed' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Set a budget range for your project. This helps freelancers understand your expectations.
          </Typography>
        )}

        {formik.values.budget.type === 'hourly' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Set an hourly rate range. The final cost will depend on the time spent on your project.
          </Typography>
        )}
      </Box>

      {/* Timeline Section */}
      <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule />
          Project Timeline
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="timeline.duration"
              label="Duration"
              type="number"
              value={formik.values.timeline.duration}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.timeline?.duration && Boolean(formik.errors.timeline?.duration)}
              helperText={formik.touched.timeline?.duration && formik.errors.timeline?.duration}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select
                name="timeline.unit"
                value={formik.values.timeline.unit}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.timeline?.unit && Boolean(formik.errors.timeline?.unit)}
                label="Unit"
              >
                <MenuItem value="days">Days</MenuItem>
                <MenuItem value="weeks">Weeks</MenuItem>
                <MenuItem value="months">Months</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          How long do you expect this project to take? This helps freelancers plan their schedule.
        </Typography>
      </Box>

      {/* Budget Summary */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Budget Summary
        </Typography>
        <Typography variant="body2" color="text.primary">
          Type: {formik.values.budget.type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
        </Typography>
        <Typography variant="body2" color="text.primary">
          Range: ${formik.values.budget.min} - ${formik.values.budget.max}
          {formik.values.budget.type === 'hourly' && '/hr'}
        </Typography>
        <Typography variant="body2" color="text.primary">
          Timeline: {formik.values.timeline.duration} {formik.values.timeline.unit}
        </Typography>
      </Box>
    </Box>
  );
};