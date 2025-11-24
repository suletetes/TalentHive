import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Avatar,
  Rating,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Pagination,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

const REVIEWS_PER_PAGE = 10;

export const FreelancerReviewsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  // Fetch freelancer info
  const { data: freelancerResponse, isLoading: freelancerLoading } = useQuery({
    queryKey: ['freelancer', id],
    queryFn: async () => {
      const response = await apiService.get(`/users/freelancer/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });

  // Fetch all reviews for this freelancer
  const { data: reviewsResponse, isLoading: reviewsLoading } = useQuery({
    queryKey: ['freelancer-reviews-all', id],
    queryFn: async () => {
      console.log(`[REVIEWS PAGE] Fetching all reviews for freelancer: ${id}`);
      try {
        const response = await apiService.get(`/reviews/freelancer/${id}?limit=1000`);
        console.log(`[REVIEWS PAGE] Response:`, response.data);
        const reviews = response.data?.data || response.data || [];
        console.log(`[REVIEWS PAGE] Parsed reviews count:`, Array.isArray(reviews) ? reviews.length : 0);
        return Array.isArray(reviews) ? reviews : [];
      } catch (error) {
        console.error(`[REVIEWS PAGE ERROR]`, error);
        throw error;
      }
    },
    enabled: !!id,
  });

  if (freelancerLoading || reviewsLoading) {
    return <LoadingSpinner />;
  }

  const freelancer = freelancerResponse;
  const allReviews = reviewsResponse || [];

  if (!freelancer) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorState message="Freelancer not found" />
      </Container>
    );
  }

  // Paginate reviews
  const totalPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);
  const startIndex = (page - 1) * REVIEWS_PER_PAGE;
  const endIndex = startIndex + REVIEWS_PER_PAGE;
  const paginatedReviews = allReviews.slice(startIndex, endIndex);

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  // Calculate rating distribution
  const ratingDistribution = {
    5: allReviews.filter((r: any) => r.rating >= 4.5).length,
    4: allReviews.filter((r: any) => r.rating >= 3.5 && r.rating < 4.5).length,
    3: allReviews.filter((r: any) => r.rating >= 2.5 && r.rating < 3.5).length,
    2: allReviews.filter((r: any) => r.rating >= 1.5 && r.rating < 2.5).length,
    1: allReviews.filter((r: any) => r.rating < 1.5).length,
  };

  const averageRating = allReviews.length > 0
    ? (allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/freelancer/${id}`)}
          sx={{ mb: 2 }}
        >
          Back to Profile
        </Button>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={freelancer.profile?.avatar}
              sx={{ width: 80, height: 80 }}
            >
              {freelancer.profile?.firstName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {freelancer.profile?.firstName} {freelancer.profile?.lastName}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {freelancer.freelancerProfile?.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Rating value={parseFloat(averageRating as string)} readOnly precision={0.1} />
                <Typography variant="body2">
                  {averageRating} ({allReviews.length} reviews)
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {/* Rating Summary */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rating Summary
              </Typography>
              <Divider sx={{ my: 2 }} />

              {[5, 4, 3, 2, 1].map((rating) => (
                <Box key={rating} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 60 }}>
                    <Typography variant="body2">{rating}</Typography>
                    <Typography variant="body2" color="text.secondary">★</Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      height: 8,
                      bgcolor: 'action.disabledBackground',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        bgcolor: rating >= 4 ? 'success.main' : rating >= 3 ? 'warning.main' : 'error.main',
                        width: `${(ratingDistribution[rating as keyof typeof ratingDistribution] / allReviews.length) * 100}%`,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ minWidth: 30 }}>
                    {ratingDistribution[rating as keyof typeof ratingDistribution]}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {averageRating}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  out of 5.0
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reviews List */}
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                All Reviews ({allReviews.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {paginatedReviews.length > 0 ? (
                <>
                  <List>
                    {paginatedReviews.map((review: any, index: number) => (
                      <Box key={review._id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0, py: 2 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Avatar
                                  src={review.client?.profile?.avatar || review.reviewer?.profile?.avatar}
                                  sx={{ width: 40, height: 40 }}
                                >
                                  {(review.client?.profile?.firstName || review.reviewer?.profile?.firstName)?.[0]}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    {review.client?.profile?.firstName || review.reviewer?.profile?.firstName}{' '}
                                    {review.client?.profile?.lastName || review.reviewer?.profile?.lastName}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Rating value={review.rating} readOnly size="small" />
                                    <Typography variant="caption" color="text.secondary">
                                      {formatDate(review.createdAt)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                color="text.primary"
                                sx={{ mt: 1, lineHeight: 1.6 }}
                              >
                                {review.feedback || review.comment}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < paginatedReviews.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, value) => {
                          setPage(value);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No reviews yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
