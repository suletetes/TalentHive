import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  FormControlLabel,
  Switch,
  Grid,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

interface RequirementsStepProps {
  formik: any;
}

export const RequirementsStep: React.FC<RequirementsStepProps> = ({ formik }) => {
  const [requirementInput, setRequirementInput] = useState('');
  const [deliverableInput, setDeliverableInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      formik.setFieldValue('requirements', [
        ...formik.values.requirements,
        requirementInput.trim(),
      ]);
      setRequirementInput('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    const newRequirements = formik.values.requirements.filter((_: any, i: number) => i !== index);
    formik.setFieldValue('requirements', newRequirements);
  };

  const handleAddDeliverable = () => {
    if (deliverableInput.trim()) {
      formik.setFieldValue('deliverables', [
        ...formik.values.deliverables,
        deliverableInput.trim(),
      ]);
      setDeliverableInput('');
    }
  };

  const handleRemoveDeliverable = (index: number) => {
    const newDeliverables = formik.values.deliverables.filter((_: any, i: number) => i !== index);
    formik.setFieldValue('deliverables', newDeliverables);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formik.values.tags.includes(tagInput.trim())) {
      formik.setFieldValue('tags', [...formik.values.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    formik.setFieldValue(
      'tags',
      formik.values.tags.filter((tag: string) => tag !== tagToRemove)
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Project Requirements & Details
      </Typography>

      <Grid container spacing={3}>
        {/* Requirements */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Project Requirements
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add a requirement"
              value={requirementInput}
              onChange={(e) => setRequirementInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddRequirement();
                }
              }}
            />
            <Button onClick={handleAddRequirement} variant="outlined" size="small">
              <Add />
            </Button>
          </Box>

          {formik.values.requirements.length > 0 ? (
            <List dense>
              {formik.values.requirements.map((requirement: string, index: number) => (
                <ListItem key={index} divider>
                  <ListItemText primary={requirement} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveRequirement(index)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No requirements added yet
            </Typography>
          )}
        </Grid>

        {/* Deliverables */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Expected Deliverables
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add a deliverable"
              value={deliverableInput}
              onChange={(e) => setDeliverableInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDeliverable();
                }
              }}
            />
            <Button onClick={handleAddDeliverable} variant="outlined" size="small">
              <Add />
            </Button>
          </Box>

          {formik.values.deliverables.length > 0 ? (
            <List dense>
              {formik.values.deliverables.map((deliverable: string, index: number) => (
                <ListItem key={index} divider>
                  <ListItemText primary={deliverable} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveDeliverable(index)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No deliverables specified yet
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* Tags */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Project Tags
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add tags to help freelancers find your project"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button onClick={handleAddTag} variant="outlined" size="small">
            <Add />
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {formik.values.tags.map((tag: string) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => handleRemoveTag(tag)}
              size="small"
            />
          ))}
        </Box>
      </Box>

      {/* Additional Settings */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Additional Settings
        </Typography>

        <TextField
          fullWidth
          name="applicationDeadline"
          label="Application Deadline (Optional)"
          type="datetime-local"
          value={formik.values.applicationDeadline}
          onChange={formik.handleChange}
          margin="normal"
          InputLabelProps={{ shrink: true }}
          helperText="Set a deadline for freelancers to submit proposals"
        />

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                name="isUrgent"
                checked={formik.values.isUrgent}
                onChange={formik.handleChange}
              />
            }
            label="Mark as Urgent"
          />
          <Typography variant="body2" color="text.secondary">
            Urgent projects get higher visibility and attract faster responses
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};