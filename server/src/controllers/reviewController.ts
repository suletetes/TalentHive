import { Request, Response, NextFunction } from 'express';
import { Review } from '@/models/Review';
import { Contract } from '@/models/Contract';
import { AppError, catchAsync } from '@/middleware/errorHandler';

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

  res.status(201).json({
    status: 'success',
    data: { review },
  });
});

export const getReviews = catchAsync(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [reviews, total] = await Promise.all([
    Review.find({ reviewee: userId, status: 'published', isPublic: true })
      .populate('reviewer', 'profile')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string)),
    Review.countDocuments({ reviewee: userId, status: 'published', isPublic: true }),
  ]);

  res.json({
    status: 'success',
    data: {
      reviews,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const respondToReview = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { reviewId } = req.params;
  const { response } = req.body;

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  if (review.reviewee.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized', 403));
  }

  review.response = response;
  review.respondedAt = new Date();
  await review.save();

  res.json({
    status: 'success',
    data: { review },
  });
});