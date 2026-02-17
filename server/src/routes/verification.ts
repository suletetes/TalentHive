import { Router } from 'express';
import {
  requestVerification,
  getVerificationStatus,
  cancelVerificationRequest,
  getPendingVerifications,
  reviewVerification,
  getVerificationStats,
  getFreelancerVerificationDetails
} from '@/controllers/freelancerVerificationController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// Freelancer routes (authenticated)
router.use(authenticate);

router.post('/request/:badgeType', requestVerification);
router.get('/status', getVerificationStatus);
router.delete('/request/:badgeType', cancelVerificationRequest);

// Admin routes
router.get('/admin/pending', authorize('admin'), getPendingVerifications);
router.post('/admin/review', authorize('admin'), reviewVerification);
router.get('/admin/stats', authorize('admin'), getVerificationStats);
router.get('/admin/freelancer/:userId', authorize('admin'), getFreelancerVerificationDetails);

export default router;
