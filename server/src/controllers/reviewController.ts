import { Request, Response, NextFunction } from 'express';
import { Review } from '@/models/Review';
import { Contract } from '@/models/Contract';
import { User } from '@/models/User';
import { AppError, catchAsync } from '@/middleware/errorHandler';
import { notificationService } from '@/services/notification.service';

interface AuthRequest extends Request {
  user?: any;
}

export const createReview = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { contractId, rating, feedback, categories } = req.body;

  const contract = await Contract.findById(contractId);
  if (!contract) {
    return next(new AppError('Contract not found', 404));
  }

  if (contract.status !== 'completed') {
    return next(new AppError('Can only review completed contracts', 400));
  }

  const isClient = contract.client.toString() === req.user._id.toString();
  const isFreelancer = contract.freelancer.toString() === req.user._id.toString();

  if (!isClient && !isFreelancer) {
    return next(new AppError('Not authorized', 403));
  }

  const reviewee = isClient ? contract.freelancer : contract.client;

  const existingReview = await Review.findOne({
    contract: contractId,
    reviewer: req.user._id,
  });

  if (existingReview) {
    return next(new AppError('Review already submitted', 400));
  }

  const review = await Review.create({
    contract: contractId,
    project: contract.project,
    reviewer: req.user._id,
    reviewee,
    rating,
    feedback,
    categories,
  });

  await review.populate('reviewer', 'profile');

  // Send notification to reviewee (only if reviewing a freelancer)
  if (isClient) {
    try {
      const client = await User.findById(req.user._id);
      const clientName = `${client?.profile.firstName} ${client?.profile.lastName}`;
      await notificationService.notifyNewReview(
        reviewee.toString(),
        clientName,
        rating,
        contract.project.toString()
      );
    } catch (error) {
      console.error('Failed to send review notification:', error);
    }
  }

  res.status(201).json({
    status: 'success',
    data: { review },
  });
});

export const getReviews = catchAsync(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  console.log('[GET_REVIEWS] Fetching reviews for user:', userId);
  console.log('[GET_REVIEWS] Page:', page, 'Limit:', limit);

  try {
    // Fetch BOTH reviews received (as reviewee) AND reviews given (as reviewer)
    const [reviewsReceived, reviewsGiven] = await Promise.all([
      Review.find({ reviewee: userId })
        .populate('reviewer', 'profile email')
        .populate('reviewee', 'profile email')
        .populate('project', 'title')
        .sort({ createdAt: -1 }),
      Review.find({ reviewer: userId })
        .populate('reviewer', 'profile email')
        .populate('reviewee', 'profile email')
        .populate('project', 'title')
        .sort({ createdAt: -1 }),
    ]);

    console.log('[GET_REVIEWS] Reviews received:', reviewsReceived.length);
    console.log('[GET_REVIEWS] Reviews given:', reviewsGiven.length);

    // Combine all reviews (frontend will filter by received/given)
    const allReviews = [...reviewsReceived, ...reviewsGiven];
    
    // Remove duplicates (in case a user reviewed themselves somehow)
    const uniqueReviews = allReviews.filter((review, index, self) =>
      index === self.findIndex((r) => r._id.toString() === review._id.toString())
    );

    // Map reviews to include 'client' field for frontend compatibility
    const reviewsWithClient = uniqueReviews.map(review => {
      const reviewObj = review.toObject();
      return {
        ...reviewObj,
        client: reviewObj.reviewer, // Add client alias for reviewer
      };
    });

    console.log('[GET_REVIEWS] Returning', reviewsWithClient.length, 'total reviews');

    res.json({
      status: 'success',
      data: reviewsWithClient,
    });
  } catch (error: any) {
    console.error('[GET_REVIEWS ERROR] Error fetching reviews:', error.message);
    console.error('[GET_REVIEWS ERROR] Stack:', error.stack);
    throw error;
  }
});

export const respondToReview = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { reviewId } = req.params;
  const { content } = req.body;

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('Unauthorized', 401));
  }

  if (review.reviewee.toString() !== userId.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  const now = new Date();
  const isEditing = !!review.response?.content;

  review.response = {
    content,
    createdAt: review.response?.createdAt || now,
    updatedAt: now,
    isEdited: isEditing,
  };
  review.respondedAt = now;
  await review.save();

  await review.populate('reviewer', 'profile email');

  res.json({
    status: 'success',
    data: { review },
  });
});