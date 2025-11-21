import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AttachMoney, Schedule, Add, Delete } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { format } from 'date-fns';

import { useCreateProposal } from '@/hooks/api/useProposals';
import { ErrorHandler, ValidationErrorHandler } from '@/utils/errorHandler';
import { useToast } from '@/components/ui/ToastProvider';

const proposalSchema = yup.object({
  coverLetter: yup.string()
    .required('Cover letter is required')
    .min(50, 'Cover letter must be at least 50 characters')
    .max(2000, 'Cover letter cannot exceed 2000 characters'),
  bidAmount: yup.number()
    .required('Bid amount is required')
    .min(1, 'Bid amount must be positive'),
  timeline: yup.object({
    duration: yup.number()
      .required('Duration is required')
      .min(1, 'Duration must be at least 1'),
    unit: yup.string()
      .required('Unit is required')
      .oneOf(['days', 'weeks', 'months']),
  }),
});

interface ProposalFormProps {
  project: {
    _id: string;
    title: string;
    budget: {
      type: 'fixed' | 'hourly';
      min: number;
      max: number;
    };
    timeline: {
      duration: number;
      unit: 'days' | 'weeks' | 'months';
    };
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProposalForm: React.FC<ProposalFormProps> = ({
  project,
  onSuccess,
  onCancel,
}) => {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    amount: 0,
    dueDate: '',
    deliverables: [],
  });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toast = useToast();

  const submitMutation = useCreateProposal();

  // Handle success
  React.useEffect(() => {
    if (submitMutation.isSuccess) {
      formik.resetForm();
      setMilestones([]);
      setAttachments([]);
      setSubmitError(null);
      onSuccess?.();
    }
  }, [submitMutation.isSuccess]);

  // Handle error
  React.useEffect(() => {
    if (submitMutation.isError) {
      const error = submitMutation.error as any;
      const apiError = ErrorHandler.handle(error);
      setSubmitError(apiError.message);
      
      // Extract field-specific errors
      const fieldErrors = ValidationErrorHandler.extractFieldErrors(apiError);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        formik.setFieldError(field, message);
      });
    }
  }, [submitMutation.isError, submitMutation.error]);

  const formik = useFormik({
    initialValues: {
      coverLetter: '',
      bidAmount: project.budget.min || 0,
      timeline: {
        duration: project.timeline.duration || 1,
        unit: project.timeline.unit || 'weeks',
      },
    },
    validationSchema: proposalSchema,
    onSubmit: (values) => {
      setSubmitError(null);
      
      const data = {
        coverLetter: values.coverLetter,
        bidAmount: values.bidAmount,
        timeline: values.timeline,
        milestones: milestones.length > 0 ? milestones : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      };
      
      submitMutation.mutate({ projectId: project._id, data });
    },
  });

  const handleAddMilestone = () => {
    if (newMilestone.title && newMilestone.description && newMilestone.amount > 0) {
      setMilestones([...milestones, { ...newMilestone, id: Date.now() }]);
      setNewMilestone({
        title: '',
        description: '',
        amount: 0,
        dueDate: '',
        deliverables: [],
      });
    }
  };

  const handleRemoveMilestone = (id: number) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const getTotalMilestoneAmount = () => {
    return milestones.reduce((total, milestone) => total + milestone.amount, 0);
  };

  const getBudgetGuidance = () => {
    const { type, min, max } = project.budget;
    if (type === 'fixed') {
      return `Client's budget: $${min} - $${max}`;
    } else {
      return `Client's hourly rate: $${min} - $${max}/hr`;
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Submit Proposal
      </Typography>
      <Typography variant="h6" color="primary" gutterBottom>
        {project.title}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {getBudgetGuidance()}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <Box component="form" onSubmit={formik.handleSubmit}>
        {/* Cover Letter */}
        <TextField
          fullWidth
          name="coverLetter"
          label="Cover Letter"
          multiline
          rows={8}
          value={formik.values.coverLetter}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.coverLetter && Boolean(formik.errors.coverLetter)}
          helperText={
            (formik.touched.coverLetter && formik.errors.coverLetter) ||
            `${formik.values.coverLetter.length}/2000 characters`
          }
          placeholder="Introduce yourself and explain why you're the perfect fit for this project. Highlight your relevant experience and approach to the work."
          sx={{ mb: 3 }}
        />

        {/* Bid Amount and Timeline */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="bidAmount"
              label={`Your ${project.budget.type === 'fixed' ? 'Bid' : 'Hourly Rate'}`}
              type="number"
              value={formik.values.bidAmount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.bidAmount && Boolean(formik.errors.bidAmount)}
              helperText={formik.touched.bidAmount && formik.errors.bidAmount}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney />
                  </InputAdornment>
                ),
                endAdornment: project.budget.type === 'hourly' && (
                  <InputAdornment position="end">/hr</InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Schedule />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
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

        <Divider sx={{ my: 3 }} />

        {/* Milestones (Optional) */}
        <Typography variant="h6" gutterBottom>
          Project Milestones (Optional)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Break down your work into milestones to build trust with the client.
        </Typography>

        {/* Add Milestone Form */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Milestone Title"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Amount"
              type="number"
              value={newMilestone.amount}
              onChange={(e) => setNewMilestone({ ...newMilestone, amount: parseFloat(e.target.value) || 0 })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size="small"
              label="Due Date"
              type="date"
              value={newMilestone.dueDate}
              onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={1}>
            <Button
              variant="outlined"
              onClick={handleAddMilestone}
              disabled={!newMilestone.title || !newMilestone.amount}
              sx={{ height: '40px' }}
            >
              <Add />
            </Button>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Milestone Description"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            />
          </Grid>
        </Grid>

        {/* Milestones List */}
        {milestones.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <List>
              {milestones.map((milestone) => (
                <ListItem key={milestone.id} divider>
                  <ListItemText
                    primary={milestone.title}
                    secondary={
                      <Box>
                        <Typography variant="body2">{milestone.description}</Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
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
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => handleRemoveMilestone(milestone.id)}>
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2">
                Total milestone amount: ${getTotalMilestoneAmount()}
              </Typography>
              {getTotalMilestoneAmount() !== formik.values.bidAmount && (
                <Typography variant="body2" color="warning.main">
                  Note: Milestone total (${getTotalMilestoneAmount()}) doesn't match bid amount (${formik.values.bidAmount})
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
          <Button 
            onClick={onCancel} 
            variant="outlined"
            disabled={submitMutation.isPending}
          >
            Cancel
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {submitMutation.isPending && <CircularProgress size={24} />}
            
            <Button
              type="submit"
              variant="contained"
              disabled={submitMutation.isPending || !formik.isValid}
              size="large"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Proposal'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};