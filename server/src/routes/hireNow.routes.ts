import { Router } from 'express';
import {
  createHireNowRequest,
  getSentRequests,
  getReceivedRequests,
  acceptHireNowRequest,
  rejectHireNowRequest,
} from '@/controllers/hireNowController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Client routes
router.post('/:freelancerId', authorize('client'), createHireNowRequest);
router.get('/sent', authorize('client'), getSentRequests);

// Freelancer routes
router.get('/received', authorize('freelancer'), getReceivedRequests);
router.put('/:id/accept', authorize('freelancer'), acceptHireNowRequest);
router.put('/:id/reject', authorize('freelancer'), rejectHireNowRequest);

export default router;
