import { Router } from 'express';
import { createReview, getReviews, getClientReviews, respondToReview } from '@/controllers/reviewController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// Public routes - no authentication required
router.get('/user/:userId', getReviews);
router.get('/freelancer/:userId', getReviews); // Alias for backward compatibility
router.get('/client/:clientId', getClientReviews); // Get reviews given by a client

// Protected routes - authentication required
router.use(authenticate);

// Both clients and freelancers can create reviews
router.post('/', authorize('client', 'freelancer'), createReview);
// Both clients and freelancers can respond to reviews
router.post('/:reviewId/respond', authorize('client', 'freelancer'), respondToReview);

export default router;