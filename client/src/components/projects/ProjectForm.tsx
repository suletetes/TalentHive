import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';

import { BasicInfoStep } from './steps/BasicInfoStep';
import { BudgetTimelineStep } from './steps/BudgetTimelineStep';
import { RequirementsStep } from './steps/RequirementsStep';
import { ReviewStep } from './steps/ReviewStep';
import { useCreateProject, useUpdateProject } from '@/hooks/api/useProjects';
import { getErrorMessage } from '@/utils/errorHandler';
import { useToast } from '@/components/ui/ToastProvider';

const steps = ['Basic Information', 'Budget & Timeline', 'Requirements', 'Review'];

const projectSchema = yup.object({
  title: yup.string()
    .required('Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be at most 200 characters'),
  description: yup.string()
    .required('Description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be at most 5000 characters'),
  category: yup.string()
    .required('Category is required')
    .min(1, 'Please select a valid category'),
  skills: yup.array()
    .of(yup.string())
    .min(1, 'At least one skill is required')
    .max(10, 'Maximum 10 skills allowed'),
  budget: yup.object({
    type: yup.string()
      .oneOf(['fixed', 'hourly'], 'Budget type must be fixed or hourly')
      .required('Budget type is required'),
    min: yup.number()
      .min(1, 'Minimum budget must be at least $1')
      .max(1000000, 'Minimum budget cannot exceed $1,000,000')
      .required('Minimum budget is required'),
    max: yup.number()
      .min(1, 'Maximum budget must be at least $1')
      .max(1000000, 'Maximum budget cannot exceed $1,000,000')
      .required('Maximum budget is required')
      .test('max-greater-than-min', 'Maximum budget must be greater than minimum budget', function(value) {
        return !value || !this.parent.min || value >= this.parent.min;
      }),
  }),
  timeline: yup.object({
    duration: yup.number()
      .min(1, 'Duration must be at least 1')
      .max(365, 'Duration cannot exceed 365 days')
      .required('Duration is required'),
    unit: yup.string()
      .oneOf(['days', 'weeks', 'months'], 'Timeline unit must be days, weeks, or months')
      .required('Timeline unit is required'),
  }),
  organization: yup.string().optional(),
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toast = useToast();
  const isEditMode = !!initialData?._id;

  const createMutation = useCreateProject({
    onSuccess: () => {
      toast.success('Project created successfully!');
      onSuccess?.();
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const updateMutation = useUpdateProject({
    onSuccess: () => {
      toast.success('Project updated successfully!');
      onSuccess?.();
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      setSubmitError(errorMessage);
      toast.error(errorMessage);
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
      status: initialData?.status || 'open',
      organization: initialData?.organization?._id || '',
    },
    validationSchema: projectSchema,
    onSubmit: (values) => {
      setSubmitError(null);
      
      if (isEditMode) {
        updateMutation.mutate({ id: initialData._id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const handleSaveAsDraft = () => {
    setSubmitError(null);
    const draftValues = { ...formik.values, status: 'draft' };
    
    if (isEditMode) {
      updateMutation.mutate({ id: initialData._id, data: draftValues });
    } else {
      createMutation.mutate(draftValues);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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

  const handleEditStep = (step: number) => {
    setActiveStep(step);
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
        return <ReviewStep formik={formik} onEditStep={handleEditStep} />;
      default:
        return null;
    }
  };  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        {isEditMode ? 'Edit Project' : 'Create New Project'}
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <Box component="form" onSubmit={formik.handleSubmit}>
        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            onClick={activeStep === 0 ? onCancel : handleBack}
            variant="outlined"
            disabled={isSubmitting}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isSubmitting && <CircularProgress size={24} />}
            
            {activeStep === steps.length - 1 ? (
              <>
                <Button
                  onClick={handleSaveAsDraft}
                  variant="outlined"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || !formik.isValid}
                >
                  {isSubmitting 
                    ? (isEditMode ? 'Updating...' : 'Publishing...') 
                    : (isEditMode ? 'Update Project' : 'Publish Project')
                  }
                </Button>
              </>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={!isStepValid(activeStep) || isSubmitting}
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