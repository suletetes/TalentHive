import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { reviewsService, CreateReviewDto } from '@/services/api';

export const reviewKeys = {
  all: ['reviews'] as const,
  user: (userId: string) => [...reviewKeys.all, 'user', userId] as const,
};

export function useUserReviews(userId: string) {
  return useQuery({
    queryKey: reviewKeys.user(userId),
    queryFn: () => reviewsService.getReviews(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contractId, data }: { contractId: string; data: CreateReviewDto }) =>
      reviewsService.createReview(contractId, data),
    onMutate: async ({ data }) => {
      // Optimistically update rating
      return { optimisticRating: data.rating };
    },
    onSuccess: (response) => {
      const revieweeId = response.data.reviewee;
      queryClient.invalidateQueries({ queryKey: reviewKeys.user(revieweeId) });
      toast.success('Review submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    },
  });
}

export function useReviewResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, content }: { reviewId: string; content: string }) =>
      reviewsService.respondToReview(reviewId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      toast.success('Response submitted!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit response');
    },
  });
}
