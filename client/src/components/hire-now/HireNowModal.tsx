import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close, Add, Delete } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/ToastProvider';

interface Milestone {
  title: string;
  description: string;
  amount: number;
  dueDate: string;
}

interface HireNowModalProps {
  open: boolean;
  onClose: () => void;
  freelancer: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    freelancerProfile?: {
      hourlyRate?: number;
    };
  };
}

const validationSchema = yup.object({
  projectTitle: yup.string().required('Project title is required').max(200, 'Title too long'),
  projectDescription: yup.string().required('Description is required').min(10, 'Description too short').max(5000, 'Description too long'),
  budget: yup.number().required('Budget is required').min(1, 'Budget must be positive'),
  timeline: yup.object({
    duration: yup.number().required('Duration is required').min(1, 'Duration must be at least 1'),
    unit: yup.string().required('Unit is required').oneOf(['days', 'weeks', 'months']),
  }),
  message: yup.string().max(2000, 'Message too long'),
});

export const HireNowModal: React.FC<HireNowModalProps> = ({ open, onClose, freelancer }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const toast = useToast();
  const queryClient = useQueryClient();

  const createHireNowMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiService.post(`/hire-now/${freelancer._id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Hire Now request sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['hire-now-sent'] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send hire now request');
    },
  });

  const formik = useFormik({
    initialValues: {
      projectTitle: '',
      projectDescription: '',
      budget: freelancer.freelancerProfile?.hourlyRate ? freelancer.freelancerProfile.hourlyRate * 40 : 0,
      timeline: {
        duration: 1,
        unit: 'weeks',
      },
      message: '',
    },
    validationSchema,
    onSubmit: (values) => {
      createHireNowMutation.mutate({
        ...values,
        milestones,
      });
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setMilestones([]);
    setActiveStep(0);
    onClose();
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      {
        title: '',
        description: '',
        amount: 0,
        dueDate: '',
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, field: keyof Milestone, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const steps = ['Project Details', 'Milestones (Optional)', 'Review'];

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <TextField
              fullWidth
              name="projectTitle"
              label="Project Title"
              value={formik.values.projectTitle}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.projectTitle && Boolean(formik.errors.projectTitle)}
              helperText={formik.touched.projectTitle && formik.errors.projectTitle}
              margin="normal"
            />

            <TextField
              fullWidth
              name="projectDescription"
              label="Project Description"
              multiline
              rows={4}
              value={formik.values.projectDescription}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.projectDescription && Boolean(formik.errors.projectDescription)}
              helperText={formik.touched.projectDescription && formik.errors.projectDescription}
              margin="normal"
            />

            <TextField
              fullWidth
              name="budget"
              label="Total Budget ($)"
              type="number"
              value={formik.values.budget}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.budget && Boolean(formik.errors.budget)}
              helperText={formik.touched.budget && formik.errors.budget}
              margin="normal"
            />

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
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
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  select
                  name="timeline.unit"
                  label="Unit"
                  value={formik.values.timeline.unit}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <MenuItem value="days">Days</MenuItem>
                  <MenuItem value="weeks">Weeks</MenuItem>
                  <MenuItem value="months">Months</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              name="message"
              label="Message (Optional)"
              multiline
              rows={3}
              value={formik.values.message}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.message && Boolean(formik.errors.message)}
              helperText={formik.touched.message && formik.errors.message}
              margin="normal"
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Milestones (Optional)
              </Typography>
              <Button startIcon={<Add />} onClick={handleAddMilestone}>
                Add Milestone
              </Button>
            </Box>

            {milestones.length === 0 ? (
              <Alert severity="info">
                You can add milestones to break down the project into smaller deliverables. This is optional.
              </Alert>
            ) : (
              milestones.map((milestone, index) => (
                <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2">Milestone {index + 1}</Typography>
                    <IconButton size="small" onClick={() => handleRemoveMilestone(index)}>
                      <Delete />
                    </IconButton>
                  </Box>

                  <TextField
                    fullWidth
                    label="Title"
                    value={milestone.title}
                    onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                    margin="dense"
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={2}
                    value={milestone.description}
                    onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                    margin="dense"
                  />

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Amount ($)"
                        type="number"
                        value={milestone.amount}
                        onChange={(e) => handleMilestoneChange(index, 'amount', parseFloat(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Due Date"
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) => handleMilestoneChange(index, 'dueDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Request
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Freelancer</Typography>
              <Typography variant="body1">
                {freelancer.profile.firstName} {freelancer.profile.lastName}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Project Title</Typography>
              <Typography variant="body1">{formik.values.projectTitle}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography variant="body1">{formik.values.projectDescription}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Budget</Typography>
              <Typography variant="body1">${formik.values.budget}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Timeline</Typography>
              <Typography variant="body1">
                {formik.values.timeline.duration} {formik.values.timeline.unit}
              </Typography>
            </Box>

            {milestones.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Milestones</Typography>
                {milestones.map((milestone, index) => (
                  <Box key={index} sx={{ ml: 2, mt: 1 }}>
                    <Typography variant="body2">
                      {index + 1}. {milestone.title} - ${milestone.amount}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {formik.values.message && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Message</Typography>
                <Typography variant="body1">{formik.values.message}</Typography>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Hire {freelancer.profile.firstName}</Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={activeStep === 0 ? handleClose : handleBack} disabled={createHireNowMutation.isPending}>
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={() => formik.handleSubmit()}
            variant="contained"
            disabled={createHireNowMutation.isPending || !formik.isValid}
            startIcon={createHireNowMutation.isPending && <CircularProgress size={20} />}
          >
            {createHireNowMutation.isPending ? 'Sending...' : 'Send Request'}
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
