import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Rating,
  Grid,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiService } from '@/services/api';

const reviewSchema = yup.object({
  rating: yup.number().required('Rating is required').min(1).max(5),
  feedback: yup.string().required('Feedback is required').min(10).max(2000),
  categories: yup.object({
    communication: yup.number().required().min(1).max(5),
    quality: yup.number().required().min(1).max(5),
    professionalism: yup.number().required().min(1).max(5),
    deadlines: yup.number().required().min(1).max(5),
  }),
});

interface ReviewFormProps {
  contractId: string;
  onSuccess?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ contractId, onSuccess }) => {
  const queryClient = useQueryClient();

  const submitReviewMutation = useMutation({
    mutationFn: (data: any) => apiService.post('/reviews', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review submitted successfully!');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    },
  });

  const formik = useFormik({
    initialValues: {
      rating: 0,
      feedback: '',
      categories: {
        communication: 0,
        quality: 0,
        professionalism: 0,
        deadlines: 0,
      },
    },
    validationSchema: reviewSchema,
    onSubmit: (values) => {
      submitReviewMutation.mutate({ ...values, contractId });
    },
  });

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Submit Review
      </Typography>

      <Box component="form" onSubmit={formik.handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Overall Rating
          </Typography>
          <Rating
            name="rating"
            value={formik.values.rating}
            onChange={(_, value) => formik.setFieldValue('rating', value)}
            size="large"
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.entries(formik.values.categories).map(([key, value]) => (
            <Grid item xs={12} sm={6} key={key}>
              <Typography variant="body2" gutterBottom sx={{ textTransform: 'capitalize' }}>
                {key}
              </Typography>
              <Rating
                value={value}
                onChange={(_, val) => formik.setFieldValue(`categories.${key}`, val)}
              />
            </Grid>
          ))}
        </Grid>

        <TextField
          fullWidth
          name="feedback"
          label="Feedback"
          multiline
          rows={6}
          value={formik.values.feedback}
          onChange={formik.handleChange}
          error={formik.touched.feedback && Boolean(formik.errors.feedback)}
          helperText={formik.touched.feedback && formik.errors.feedback}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitReviewMutation.isPending}
        >
          {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
        </Button>
      </Box>
    </Paper>
  );
};