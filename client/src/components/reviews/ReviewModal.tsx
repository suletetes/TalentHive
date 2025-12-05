import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Star } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LoadingButton } from '@mui/lab';

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  contractId: string;
  revieweeId: string;
  revieweeName: string;
  revieweeRole: 'client' | 'freelancer';
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  open,
  onClose,
  contractId,
  revieweeId,
  revieweeName,
  revieweeRole,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const submitReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit review');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review submitted successfully!');
      handleClose();
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to submit review');
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Please provide a comment with at least 10 characters');
      return;
    }

    submitReviewMutation.mutate({
      contract: contractId,
      reviewee: revieweeId,
      rating,
      comment: comment.trim(),
    });
  };

  const handleClose = () => {
    setRating(5);
    setComment('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star sx={{ color: 'warning.main' }} />
          <Typography variant="h6">
            Review {revieweeName}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Share your experience working with {revieweeName}. Your feedback helps build trust in our community.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Rating *
            </Typography>
            <Rating
              value={rating}
              onChange={(_, newValue) => {
                setRating(newValue || 0);
                setError(null);
              }}
              size="large"
              sx={{
                '& .MuiRating-iconFilled': {
                  color: 'warning.main',
                },
              }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Your Review *
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder={`Tell us about your experience with ${revieweeName}...`}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError(null);
              }}
              helperText={`${comment.length}/500 characters (minimum 10)`}
              inputProps={{ maxLength: 500 }}
            />
          </Box>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="caption" color="info.contrastText">
              💡 Tip: Be specific and constructive. Mention communication, quality of work, timeliness, and professionalism.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitReviewMutation.isPending}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSubmit}
          loading={submitReviewMutation.isPending}
          disabled={rating === 0 || comment.trim().length < 10}
        >
          Submit Review
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
