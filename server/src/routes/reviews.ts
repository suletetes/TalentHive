import { Router } from 'express';
import { createReview, getReviews, respondToReview } from '@/controllers/reviewController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

router.use(authenticate);

// Both clients and freelancers can create reviews
router.post('/', authorize('client', 'freelancer'), createReview);
// Public route to view reviews
router.get('/user/:userId', getReviews);
// Both clients and freelancers can respond to reviews
router.post('/:reviewId/respond', authorize('client', 'freelancer'), respondToReview);

export default router;