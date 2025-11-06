import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { BasicInfoStep } from './steps/BasicInfoStep';
import { BudgetTimelineStep } from './steps/BudgetTimelineStep';
import { RequirementsStep } from './steps/RequirementsStep';
import { ReviewStep } from './steps/ReviewStep';
import { apiService } from '@/services/api';

const steps = ['Basic Information', 'Budget & Timeline', 'Requirements', 'Review'];

const projectSchema = yup.object({
  title: yup.string().required('Title is required').max(200, 'Title too long'),
  description: yup.string().required('Description is required').min(10, 'Description too short').max(5000, 'Description too long'),
  category: yup.string().required('Category is required'),
  skills: yup.array().of(yup.string()).min(1, 'At least one skill is required'),
  budget: yup.object({
    type: yup.string().oneOf(['fixed', 'hourly']).required(),
    min: yup.number().min(0, 'Budget must be positive').required(),
    max: yup.number().min(0, 'Budget must be positive').required(),
  }),
  timeline: yup.object({
    duration: yup.number().min(1, 'Duration must be at least 1').required(),
    unit: yup.string().oneOf(['days', 'weeks', 'months']).required(),
  }),
});

interface ProjectFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiService.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully!');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    },
  });

  const formik = useFormik({
    initialValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      skills: initialData?.skills || [],
      budget: {
        type: initialData?.budget?.type || 'fixed',
        min: initialData?.budget?.min || 0,
        max: initialData?.budget?.max || 0,
      },
      timeline: {
        duration: initialData?.timeline?.duration || 1,
        unit: initialData?.timeline?.unit || 'weeks',
      },
      requirements: initialData?.requirements || [],
      deliverables: initialData?.deliverables || [],
      tags: initialData?.tags || [],
      visibility: initialData?.visibility || 'public',
      isUrgent: initialData?.isUrgent || false,
      applicationDeadline: initialData?.applicationDeadline || '',
    },
    validationSchema: projectSchema,
    onSubmit: (values) => {
      createMutation.mutate(values);
    },
  });

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return !formik.errors.title && !formik.errors.description && 
               !formik.errors.category && !formik.errors.skills;
      case 1:
        return !formik.errors.budget && !formik.errors.timeline;
      case 2:
        return true; // Requirements are optional
      case 3:
        return true; // Review step
      default:
        return false;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <BasicInfoStep formik={formik} />;
      case 1:
        return <BudgetTimelineStep formik={formik} />;
      case 2:
        return <RequirementsStep formik={formik} />;
      case 3:
        return <ReviewStep formik={formik} />;
      default:
        return null;
    }
  };  return (

    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        {initialData ? 'Edit Project' : 'Create New Project'}
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box component="form" onSubmit={formik.handleSubmit}>
        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={activeStep === 0 ? onCancel : handleBack}
            variant="outlined"
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={!isStepValid(activeStep)}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};