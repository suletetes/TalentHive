import { Router } from 'express';
import {
  createHireNowRequest,
  getSentRequests,
  getReceivedRequests,
  acceptHireNowRequest,
  rejectHireNowRequest,
} from '@/controllers/hireNowController';
import { protect } from '@/middleware/auth';
import { authorizeRoles } from '@/middleware/roleAuth';

const router = Router();

// All routes require authentication
router.use(protect);

// Client routes
router.post('/:freelancerId', authorizeRoles('client'), createHireNowRequest);
router.get('/sent', authorizeRoles('client'), getSentRequests);

// Freelancer routes
router.get('/received', authorizeRoles('freelancer'), getReceivedRequests);
router.put('/:id/accept', authorizeRoles('freelancer'), acceptHireNowRequest);
router.put('/:id/reject', authorizeRoles('freelancer'), rejectHireNowRequest);

export default router;
