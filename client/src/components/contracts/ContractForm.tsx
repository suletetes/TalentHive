import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import { apiService } from '@/services/api';

const contractSchema = yup.object({
  title: yup.string()
    .required('Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: yup.string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  startDate: yup.date()
    .required('Start date is required')
    .min(new Date(), 'Start date cannot be in the past'),
  endDate: yup.date()
    .required('End date is required')
    .min(yup.ref('startDate'), 'End date must be after start date'),
});

interface ContractFormProps {
  proposal: {
    _id: string;
    project: {
      title: string;
    };
    freelancer: {
      profile: {
        firstName: string;
        lastName: string;
      };
    };
    bidAmount: number;
    timeline: {
      duration: number;
      unit: 'days' | 'weeks' | 'months';
    };
    milestones?: Array<{
      title: string;
      description: string;
      amount: number;
      dueDate: string;
    }>;
  };
  onSuccess?: (contract: any) => void;
  onCancel?: () => void;
}

export const ContractForm: React.FC<ContractFormProps> = ({
  proposal,
  onSuccess,
  onCancel,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [milestones, setMilestones] = useState(
    proposal.milestones || [
      {
        title: 'Project Completion',
        description: 'Complete all project deliverables',
        amount: proposal.bidAmount,
        dueDate: '',
      },
    ]
  );
  const [terms, setTerms] = useState({
    paymentTerms: 'Payment will be released upon milestone completion and client approval.',
    cancellationPolicy: 'Either party may cancel this contract with 7 days written notice.',
    intellectualProperty: 'All work product created under this contract will be owned by the client.',
    confidentiality: 'Both parties agree to maintain confidentiality of all project information.',
    disputeResolution: 'Disputes will be resolved through the platform\'s dispute resolution process.',
    additionalTerms: '',
  });

  const queryClient = useQueryClient();

  const createContractMutation = useMutation({
    mutationFn: (data: any) => apiService.post(`/contracts/proposal/${proposal._id}`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract created successfully!');
      onSuccess?.(response.data.data.contract);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create contract');
    },
  });

  const calculateEndDate = (): Date => {
    const { duration, unit } = proposal.timeline;
    const startDate: Date = formik.values.startDate ? new Date(formik.values.startDate) : new Date();
    
    let days = duration;
    if (unit === 'weeks') days *= 7;
    if (unit === 'months') days *= 30;
    
    return addDays(startDate, days);
  };

  const formik: any = useFormik({
    initialValues: {
      title: `Contract for ${proposal.project.title}`,
      description: `This contract outlines the terms and conditions for the completion of ${proposal.project.title} by ${proposal.freelancer.profile.firstName} ${proposal.freelancer.profile.lastName}.`,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(calculateEndDate(), 'yyyy-MM-dd'),
    },
    validationSchema: contractSchema,
    onSubmit: (values) => {
      const contractData = {
        ...values,
        terms,
        customMilestones: milestones,
      };
      createContractMutation.mutate(contractData);
    },
  });

  const steps = ['Basic Information', 'Milestones', 'Terms & Conditions', 'Review'];

  const addMilestone = () => {
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

  const updateMilestone = (index: number, field: string, value: any) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };
    setMilestones(updatedMilestones);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const getTotalMilestoneAmount = () => {
    return milestones.reduce((total, milestone) => total + (milestone.amount || 0), 0);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      formik.handleSubmit();
      if (formik.isValid) {
        setActiveStep(activeStep + 1);
      }
    } else if (activeStep === 1) {
      // Validate milestones
      const totalAmount = getTotalMilestoneAmount();
      if (Math.abs(totalAmount - proposal.bidAmount) > 0.01) {
        toast.error('Total milestone amount must equal proposal bid amount');
        return;
      }
      setActiveStep(activeStep + 1);
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Contract Basic Information
            </Typography>
            
            <TextField
              fullWidth
              name="title"
              label="Contract Title"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
              margin="normal"
            />

            <TextField
              fullWidth
              name="description"
              label="Contract Description"
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
              margin="normal"
            />

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="startDate"
                  label="Start Date"
                  type="date"
                  value={formik.values.startDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                  helperText={formik.touched.startDate && formik.errors.startDate}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="endDate"
                  label="End Date"
                  type="date"
                  value={formik.values.endDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                  helperText={formik.touched.endDate && formik.errors.endDate}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Project Milestones
              </Typography>
              <Button
                startIcon={<Add />}
                onClick={addMilestone}
                variant="outlined"
                size="small"
              >
                Add Milestone
              </Button>
            </Box>

            {milestones.map((milestone, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">
                      Milestone {index + 1}
                    </Typography>
                    {milestones.length > 1 && (
                      <IconButton
                        onClick={() => removeMilestone(index)}
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Milestone Title"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Amount"
                        type="number"
                        value={milestone.amount}
                        onChange={(e) => updateMilestone(index, 'amount', parseFloat(e.target.value) || 0)}
                        size="small"
                        InputProps={{
                          startAdornment: <span>$</span>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Due Date"
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Description"
                        multiline
                        rows={2}
                        value={milestone.description}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2">
                Total milestone amount: ${getTotalMilestoneAmount()}
              </Typography>
              <Typography variant="body2">
                Proposal bid amount: ${proposal.bidAmount}
              </Typography>
              {Math.abs(getTotalMilestoneAmount() - proposal.bidAmount) > 0.01 && (
                <Typography variant="body2" color="error">
                  ⚠️ Milestone total must equal proposal bid amount
                </Typography>
              )}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Terms & Conditions
            </Typography>

            <TextField
              fullWidth
              label="Payment Terms"
              multiline
              rows={2}
              value={terms.paymentTerms}
              onChange={(e) => setTerms({ ...terms, paymentTerms: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Cancellation Policy"
              multiline
              rows={2}
              value={terms.cancellationPolicy}
              onChange={(e) => setTerms({ ...terms, cancellationPolicy: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Intellectual Property"
              multiline
              rows={2}
              value={terms.intellectualProperty}
              onChange={(e) => setTerms({ ...terms, intellectualProperty: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Confidentiality"
              multiline
              rows={2}
              value={terms.confidentiality}
              onChange={(e) => setTerms({ ...terms, confidentiality: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Dispute Resolution"
              multiline
              rows={2}
              value={terms.disputeResolution}
              onChange={(e) => setTerms({ ...terms, disputeResolution: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Additional Terms (Optional)"
              multiline
              rows={3}
              value={terms.additionalTerms}
              onChange={(e) => setTerms({ ...terms, additionalTerms: e.target.value })}
              margin="normal"
              placeholder="Add any additional terms or conditions..."
            />
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Contract Review
            </Typography>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Basic Information
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Title:</strong> {formik.values.title}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Description:</strong> {formik.values.description}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Duration:</strong> {formik.values.startDate} to {formik.values.endDate}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Amount:</strong> ${proposal.bidAmount}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Milestones ({milestones.length})
                </Typography>
                <List dense>
                  {milestones.map((milestone, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={milestone.title}
                        secondary={
                          <Box>
                            <Typography variant="body2">{milestone.description}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip label={`$${milestone.amount}`} size="small" />
                              {milestone.dueDate && (
                                <Chip 
                                  label={format(new Date(milestone.dueDate), 'MMM dd, yyyy')} 
                                  size="small" 
                                  variant="outlined" 
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Terms & Conditions
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Payment Terms:</strong> {terms.paymentTerms}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Cancellation Policy:</strong> {terms.cancellationPolicy}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Intellectual Property:</strong> {terms.intellectualProperty}
                </Typography>
                {terms.additionalTerms && (
                  <Typography variant="body2" paragraph>
                    <strong>Additional Terms:</strong> {terms.additionalTerms}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Create Contract
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Creating contract for proposal from {proposal.freelancer.profile.firstName} {proposal.freelancer.profile.lastName}
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box component="form" onSubmit={formik.handleSubmit}>
        {renderStepContent()}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeStep > 0 && (
              <Button onClick={handleBack} variant="outlined">
                Back
              </Button>
            )}
            
            {activeStep < steps.length - 1 ? (
              <Button onClick={handleNext} variant="contained">
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={createContractMutation.isPending}
                size="large"
              >
                {createContractMutation.isPending ? 'Creating...' : 'Create Contract'}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};