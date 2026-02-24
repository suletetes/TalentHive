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

// Helper function to get abbreviated labels for mobile
const getAbbreviatedLabel = (label: string): string => {
  const abbreviations: { [key: string]: string } = {
    'Basic Information': 'Basic',
    'Budget & Timeline': 'Budget',
    'Requirements': 'Reqs',
    'Review': 'Review'
  };
  return abbreviations[label] || label.split(' ')[0];
};

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
        // Basic info: title, description, category, and at least one skill
        const hasTitle = formik.values.title && formik.values.title.trim().length >= 5;
        const hasDescription = formik.values.description && formik.values.description.trim().length >= 20;
        const hasCategory = formik.values.category && formik.values.category.trim().length > 0;
        const hasSkills = Array.isArray(formik.values.skills) && formik.values.skills.length > 0;
        
        return hasTitle && hasDescription && hasCategory && hasSkills &&
               !formik.errors.title && !formik.errors.description && 
               !formik.errors.category && !formik.errors.skills;
      case 1:
        // Budget & Timeline
        const hasBudget = formik.values.budget?.min > 0 && formik.values.budget?.max > 0 &&
                         formik.values.budget?.max >= formik.values.budget?.min;
        const hasTimeline = formik.values.timeline?.duration > 0;
        
        return hasBudget && hasTimeline && !formik.errors.budget && !formik.errors.timeline;
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

  // Fill test data function for development
  const fillTestData = () => {
    const sampleData = {
      title: 'Full-Stack Task Management Application',
      description: 'Develop a comprehensive task management web application with real-time collaboration features, user authentication, and project tracking capabilities. The application should support team collaboration, file attachments, comments, and notifications. We need a modern, responsive design that works seamlessly across desktop and mobile devices.',
      category: '', // Will be filled from available categories
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'REST API'],
      budget: {
        type: 'fixed',
        min: 7500,
        max: 10000,
      },
      timeline: {
        duration: 75,
        unit: 'days',
      },
      requirements: [
        'User authentication and authorization',
        'Real-time updates using WebSockets',
        'Task creation, assignment, and tracking',
        'Team collaboration features',
        'File upload and management',
        'Email notifications',
        'Responsive design for mobile and desktop',
        'Admin dashboard with analytics',
      ],
      deliverables: [
        'Complete source code with documentation',
        'Deployed application on cloud platform',
        'User manual and technical documentation',
        'Unit and integration tests',
      ],
      tags: ['web-development', 'full-stack', 'react', 'nodejs'],
      visibility: 'public',
      isUrgent: false,
      applicationDeadline: '',
      status: 'open',
      organization: '',
    };

    formik.setValues(sampleData);
    toast.success('Test data filled! Remember to select a category.');
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
    <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 2
      }}>
        <Typography variant="h5" sx={{
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          {isEditMode ? 'Edit Project' : 'Create New Project'}
        </Typography>
        
        {/* Test Data Button - Only show in development and not in edit mode */}
        {import.meta.env.DEV && !isEditMode && (
          <Button
            variant="outlined"
            size="small"
            onClick={fillTestData}
            color="secondary"
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              whiteSpace: 'nowrap'
            }}
          >
             Fill Test Data
          </Button>
        )}
      </Box>

      <Stepper 
        activeStep={activeStep} 
        sx={{ 
          mb: 4,
          // Responsive stepper styling
          '& .MuiStepLabel-root': {
            padding: { xs: '0 2px', sm: '0 8px' },
          },
          '& .MuiStepLabel-label': {
            fontSize: { xs: '0.625rem', sm: '0.875rem' },
            fontWeight: 500,
            textAlign: 'center',
            lineHeight: 1.2,
            // Show abbreviated labels on mobile
            display: 'block',
          },
          '& .MuiStepLabel-labelContainer': {
            maxWidth: { xs: '50px', sm: '120px', md: 'none' },
          },
          // Step icon (number) styling
          '& .MuiStepIcon-root': {
            fontSize: { xs: '1rem', sm: '1.5rem' },
            '& .MuiStepIcon-text': {
              fontSize: { xs: '0.625rem', sm: '0.875rem' },
              fontWeight: 600,
            },
          },
          // Connector line styling
          '& .MuiStepConnector-root': {
            display: { xs: 'none', sm: 'block' },
          },
          // Step container styling
          '& .MuiStep-root': {
            padding: { xs: '0 1px', sm: '0 8px' },
            flex: 1,
          },
          // Horizontal scroll for mobile if needed
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
        }}
        alternativeLabel
      >
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>
              {/* Show abbreviated labels on mobile, full labels on desktop */}
              <Box sx={{ 
                fontSize: { xs: '0.625rem', sm: '0.875rem' },
                textAlign: 'center',
                lineHeight: 1.2,
                wordBreak: 'break-word',
                hyphens: 'auto'
              }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {label}
                </Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                  {getAbbreviatedLabel(label)}
                </Box>
              </Box>
            </StepLabel>
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

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 2, sm: 0 },
          mt: 4 
        }}>
          <Button
            onClick={activeStep === 0 ? onCancel : handleBack}
            variant="outlined"
            disabled={isSubmitting}
            size="large"
            sx={{ 
              order: { xs: 2, sm: 0 },
              minHeight: { xs: 48, sm: 36 }
            }}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            order: { xs: 1, sm: 0 },
            width: { xs: '100%', sm: 'auto' }
          }}>
            {isSubmitting && (
              <CircularProgress 
                size={24} 
                sx={{ 
                  alignSelf: { xs: 'center', sm: 'auto' },
                  mb: { xs: 1, sm: 0 }
                }} 
              />
            )}
            
            {activeStep === steps.length - 1 ? (
              <Box sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 2 },
                width: { xs: '100%', sm: 'auto' }
              }}>
                <Button
                  onClick={handleSaveAsDraft}
                  variant="outlined"
                  disabled={isSubmitting}
                  size="large"
                  sx={{ 
                    minHeight: { xs: 48, sm: 36 },
                    flex: { xs: 1, sm: 'none' }
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || !formik.isValid}
                  size="large"
                  sx={{ 
                    minHeight: { xs: 48, sm: 36 },
                    flex: { xs: 1, sm: 'none' }
                  }}
                >
                  {isSubmitting 
                    ? (isEditMode ? 'Updating...' : 'Publishing...') 
                    : (isEditMode ? 'Update Project' : 'Publish Project')
                  }
                </Button>
              </Box>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={!isStepValid(activeStep) || isSubmitting}
                size="large"
                sx={{ 
                  minHeight: { xs: 48, sm: 36 },
                  width: { xs: '100%', sm: 'auto' }
                }}
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