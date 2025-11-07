import { Router } from 'express';
import { createReview, getReviews, respondToReview } from '@/controllers/reviewController';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createReview);
router.get('/user/:userId', getReviews);
router.post('/:reviewId/respond', respondToReview);

export default router;