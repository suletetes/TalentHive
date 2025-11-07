import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Avatar,
  Grid,
  Pagination,
  CircularProgress,
} from '@mui/material';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

interface ReviewListProps {
  userId: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({ userId }) => {
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', userId, page],
    queryFn: async () => {
      const response = await apiService.get(`/reviews/user/${userId}?page=${page}`);
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const reviews = data?.reviews || [];
  const pagination = data?.pagination || {};

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Reviews ({pagination.total || 0})
      </Typography>

      {reviews.map((review: any) => (
        <Card key={review._id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar src={review.reviewer.profile.avatar} sx={{ mr: 2 }}>
                {review.reviewer.profile.firstName[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">
                  {review.reviewer.profile.firstName} {review.reviewer.profile.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                </Typography>
              </Box>
              <Rating value={review.rating} readOnly />
            </Box>

            <Typography variant="body2" paragraph>
              {review.feedback}
            </Typography>

            <Grid container spacing={2}>
              {Object.entries(review.categories).map(([key, value]) => (
                <Grid item xs={6} sm={3} key={key}>
                  <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                    {key}
                  </Typography>
                  <Rating value={value as number} readOnly size="small" />
                </Grid>
              ))}
            </Grid>

            {review.response && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Response:
                </Typography>
                <Typography variant="body2">{review.response}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.pages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};