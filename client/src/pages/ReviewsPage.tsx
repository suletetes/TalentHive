import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Rating,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { reviewsService, Review } from '@/services/api/reviews.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reviews-tabpanel-${index}`}
      aria-labelledby={`reviews-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ReviewsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseContent, setResponseContent] = useState('');

  // Fetch reviews
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reviews', user?._id],
    queryFn: async () => {
      if (!user?._id) return [];
      console.log(`[REVIEWS PAGE] Fetching reviews for user: ${user._id}`);
      try {
        const response: any = await reviewsService.getReviews(user._id);
        console.log(`[REVIEWS PAGE] Raw response:`, response);
        
        // API returns { status: 'success', data: [...reviews] }
        // reviewsService wraps axios response, so we get response.data from axios
        let reviews = [];
        if (response?.data && Array.isArray(response.data)) {
          reviews = response.data;
        } else if (Array.isArray(response)) {
          reviews = response;
        }
        
        console.log(`[REVIEWS PAGE] Found ${reviews.length} reviews`);
        return reviews;
      } catch (err) {
        console.error(`[REVIEWS PAGE ERROR]`, err);
        throw err;
      }
    },
    enabled: !!user?._id,
  });

  // Respond to review mutation
  const respondMutation = useMutation({
    mutationFn: ({ reviewId, content }: { reviewId: string; content: string }) =>
      reviewsService.respondToReview(reviewId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', user?._id] });
      toast.success('Response submitted successfully');
      setRespondDialogOpen(false);
      setSelectedReview(null);
      setResponseContent('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit response');
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRespondClick = (review: Review) => {
    setSelectedReview(review);
    setRespondDialogOpen(true);
  };

  const handleRespondSubmit = () => {
    if (!selectedReview || !responseContent.trim()) {
      toast.error('Please enter a response');
      return;
    }
    respondMutation.mutate({
      reviewId: selectedReview._id,
      content: responseContent,
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading reviews..." />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState error={error} onRetry={refetch} />
      </Container>
    );
  }

  const reviews = data || [];
  
  // Separate reviews into received and given
  const reviewsReceived = reviews.filter(
    (review) => review.reviewee === user?._id || (typeof review.reviewee === 'object' && (review.reviewee as any)._id === user?._id)
  );
  const reviewsGiven = reviews.filter(
    (review) => review.reviewer._id === user?._id
  );

  const renderReviewCard = (review: Review, isReceived: boolean) => (
    <Card key={review._id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Avatar
            src={review.reviewer.profile?.avatar}
            alt={`${review.reviewer.profile?.firstName} ${review.reviewer.profile?.lastName}`}
            sx={{ width: 56, height: 56 }}
          />
          <Box flex={1}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Box>
                <Typography variant="h6">
                  {review.reviewer.profile?.firstName} {review.reviewer.profile?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(review.createdAt), 'MMMM dd, yyyy')}
                </Typography>
              </Box>
              <Rating value={review.rating} readOnly precision={0.5} />
            </Box>

            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {review.feedback || review.comment || 'No feedback provided'}
            </Typography>

            {review.response && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: 'primary.main',
                }}
              >
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Your Response
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {review.response.content}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {format(new Date(review.response.createdAt), 'MMMM dd, yyyy')}
                </Typography>
              </Box>
            )}

            {isReceived && !review.response && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleRespondClick(review)}
                sx={{ mt: 1 }}
              >
                Respond
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Reviews
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View and manage your reviews
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`Reviews Received (${reviewsReceived.length})`} />
          <Tab label={`Reviews Given (${reviewsGiven.length})`} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {reviewsReceived.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                You haven't received any reviews yet. Complete projects to receive reviews from clients.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box>
            {reviewsReceived.map((review) => renderReviewCard(review, true))}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {reviewsGiven.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                You haven't given any reviews yet. Complete projects and leave reviews for your experience.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box>
            {reviewsGiven.map((review) => renderReviewCard(review, false))}
          </Box>
        )}
      </TabPanel>

      {/* Respond to Review Dialog */}
      <Dialog
        open={respondDialogOpen}
        onClose={() => setRespondDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Respond to Review</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <>
              <Box mb={3}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    src={selectedReview.reviewer.profile?.avatar}
                    alt={`${selectedReview.reviewer.profile?.firstName} ${selectedReview.reviewer.profile?.lastName}`}
                  />
                  <Box>
                    <Typography variant="subtitle1">
                      {selectedReview.reviewer.profile?.firstName} {selectedReview.reviewer.profile?.lastName}
                    </Typography>
                    <Rating value={selectedReview.rating} readOnly size="small" />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedReview.feedback || selectedReview.comment || 'No feedback provided'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <TextField
                label="Your Response"
                multiline
                rows={4}
                fullWidth
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                placeholder="Write your response..."
                helperText="Be professional and constructive in your response"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRespondDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRespondSubmit}
            color="primary"
            variant="contained"
            disabled={respondMutation.isPending || !responseContent.trim()}
          >
            {respondMutation.isPending ? 'Submitting...' : 'Submit Response'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
