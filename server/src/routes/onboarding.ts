import { Router } from 'express';
import {
  getOnboardingStatus,
  updateOnboardingStep,
  completeOnboarding,
  skipOnboarding,
  getOnboardingAnalytics,
  getUserOnboardingAnalytics,
} from '@/controllers/onboardingController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// User onboarding routes (requires authentication)
router.get('/status', authenticate, getOnboardingStatus);
router.patch('/step', authenticate, updateOnboardingStep);
router.post('/complete', authenticate, completeOnboarding);
router.post('/skip', authenticate, skipOnboarding);

// Analytics routes
router.get('/analytics', authenticate, authorize('admin'), getOnboardingAnalytics);
router.get('/analytics/:userId', authenticate, getUserOnboardingAnalytics);

export default router;
