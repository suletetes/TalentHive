import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { proposalsService } from '@/services/api/proposals.service';
import { useToast } from '@/components/ui/ToastProvider';

const editProposalSchema = yup.object({
  coverLetter: yup.string()
    .required('Cover letter is required')
    .min(50, 'Cover letter must be at least 50 characters')
    .max(2000, 'Cover letter cannot exceed 2000 characters')
    .test('no-spam', 'Cover letter appears to be spam', function(value) {
      if (!value) return true;
      const words = value.split(' ');
      const uniqueWords = new Set(words);
      return uniqueWords.size > words.length * 0.3;
    }),
  bidAmount: yup.number()
    .required('Bid amount is required')
    .min(1, 'Bid amount must be at least $1')
    .max(1000000, 'Bid amount cannot exceed $1,000,000')
    .typeError('Bid amount must be a valid number'),
  timeline: yup.object({
    duration: yup.number()
      .required('Duration is required')
      .min(1, 'Duration must be at least 1')
      .max(365, 'Duration cannot exceed 365 days')
      .typeError('Duration must be a valid number'),
    unit: yup.string()
      .required('Timeline unit is required')
      .oneOf(['days', 'weeks', 'months'], 'Timeline unit must be days, weeks, or months'),
  }),
});

interface EditProposalFormProps {
  proposal: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EditProposalForm: React.FC<EditProposalFormProps> = ({
  proposal,
  onSuccess,
  onCancel,
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: any) => proposalsService.updateProposal(proposal._id, data),
    onSuccess: () => {
      toast.success('Proposal updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update proposal';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const formik = useFormik({
    initialValues: {
      coverLetter: proposal.coverLetter || '',
      bidAmount: proposal.bidAmount || proposal.proposedBudget?.amount || 0,
      timeline: {
        duration: proposal.timeline?.duration || 1,
        unit: proposal.timeline?.unit || 'weeks',
      },
    },
    validationSchema: editProposalSchema,
    onSubmit: (values) => {
      setSubmitError(null);
      updateMutation.mutate(values);
    },
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Edit Proposal
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <Box component="form" onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          label="Cover Letter"
          name="coverLetter"
          multiline
          rows={6}
          value={formik.values.coverLetter}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.coverLetter && Boolean(formik.errors.coverLetter)}
          helperText={formik.touched.coverLetter && formik.errors.coverLetter}
          margin="normal"
          placeholder="Explain why you're the best fit for this project..."
        />

        <TextField
          fullWidth
          label="Bid Amount"
          name="bidAmount"
          type="number"
          value={formik.values.bidAmount}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.bidAmount && Boolean(formik.errors.bidAmount)}
          helperText={formik.touched.bidAmount && formik.errors.bidAmount}
          margin="normal"
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
        />

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Duration"
              name="timeline.duration"
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
              label="Unit"
              name="timeline.unit"
              value={formik.values.timeline.unit}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.timeline?.unit && Boolean(formik.errors.timeline?.unit)}
              helperText={formik.touched.timeline?.unit && formik.errors.timeline?.unit}
              SelectProps={{
                native: true,
              }}
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            onClick={onCancel}
            variant="outlined"
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updateMutation.isPending || !formik.isValid}
            startIcon={updateMutation.isPending && <CircularProgress size={20} />}
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Proposal'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
