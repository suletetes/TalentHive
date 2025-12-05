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

  // ISSUE #16 FIX: Update reviewee's rating
  try {
    const revieweeUser = await User.findById(reviewee);
    if (revieweeUser) {
      revieweeUser.updateRating(rating);
      await revieweeUser.save();
      console.log(`[REVIEW] Updated rating for user ${reviewee}: ${revieweeUser.rating.average} (${revieweeUser.rating.count} reviews)`);
    }
  } catch (error) {
    console.error('Failed to update user rating:', error);
  }

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

  // Fetch BOTH reviews received (as reviewee) AND reviews given (as reviewer)
  const [reviewsReceived, reviewsGiven] = await Promise.all([
    Review.find({ reviewee: userId })
      .lean()
      .populate('reviewer', 'profile email')
      .populate('reviewee', 'profile email')
      .populate('project', 'title')
      .sort({ createdAt: -1 }),
    Review.find({ reviewer: userId })
      .lean()
      .populate('reviewer', 'profile email')
      .populate('reviewee', 'profile email')
      .populate('project', 'title')
      .sort({ createdAt: -1 }),
  ]);

  // Combine all reviews (frontend will filter by received/given)
  const allReviews = [...reviewsReceived, ...reviewsGiven];

  // Remove duplicates (in case a user reviewed themselves somehow)
  const uniqueReviews = allReviews.filter((review, index, self) =>
    index === self.findIndex((r) => r._id.toString() === review._id.toString())
  );

  // Map reviews to include 'client' field for frontend compatibility
  const reviewsWithClient = uniqueReviews.map((review) => ({
    ...review,
    client: review.reviewer,
  }));

  res.json({
    status: 'success',
    data: reviewsWithClient,
  });
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
  const existingResponse = review.response as { content?: string; createdAt?: Date } | undefined;
  const isEditing = !!(existingResponse && existingResponse.content);

  // Set the response object directly on the document and save
  review.response = {
    content: content,
    createdAt: existingResponse?.createdAt || now,
    updatedAt: now,
    isEdited: isEditing,
  };
  review.respondedAt = now;

  await review.save();

  // Re-fetch with population
  const updatedReview = await Review.findById(reviewId)
    .populate('reviewer', 'profile email')
    .lean();

  res.json({
    status: 'success',
    data: { review: updatedReview },
  });
});