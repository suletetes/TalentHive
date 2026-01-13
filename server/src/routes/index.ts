import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import projectRoutes from './projects';
import proposalRoutes from './proposals';
import contractRoutes from './contracts';
import paymentRoutes from './payments';
import messageRoutes from './messages';
import reviewRoutes from './reviews';
import notificationRoutes from './notifications';
import settingsRoutes from './settings';
import adminRoutes from './admin';
import healthRoutes from './health';
import transactionRoutes from './transactions';
import verificationRoutes from './verification';
import uploadRoutes from './upload';
import timeTrackingRoutes from './timeTracking';
import workLogRoutes from './workLog';
import organizationRoutes from './organizations';
import servicePackageRoutes from './servicePackages';
import disputeRoutes from './disputes';
import supportTicketRoutes from './supportTicket';
import onboardingRoutes from './onboarding';
import searchRoutes from './search';
import categoryRoutes from './categories';
import skillRoutes from './skills';
import webhookRoutes from './webhook.routes';
import analyticsRoutes from './analytics.routes';
import hireNowRoutes from './hireNow.routes';
import rbacRoutes from './rbac';
import { getFeaturedFreelancers } from '@/controllers/adminController';

// Conditionally import dev routes
let devRoutes: any = null;
if (process.env.NODE_ENV === 'development' || process.env.MOCK_STRIPE_CONNECT === 'true') {
  try {
    devRoutes = require('./dev').default;
  } catch (error) {
    console.warn('Dev routes not found, skipping...');
  }
}

const router = Router();

// Health check for API
router.get('/', (_req, res) => {
  res.json({
    status: 'success',
    message: 'TalentHive API is running',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check routes (no /api prefix needed)
router.use('/health', healthRoutes);

// Route handlers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/proposals', proposalRoutes);
router.use('/contracts', contractRoutes);
router.use('/payments', paymentRoutes);
router.use('/messages', messageRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/transactions', transactionRoutes);
router.use('/verification', verificationRoutes);
router.use('/upload', uploadRoutes);
router.use('/admin', adminRoutes);
router.use('/time-tracking', timeTrackingRoutes);
router.use('/work-logs', workLogRoutes);
router.use('/organizations', organizationRoutes);
router.use('/services', servicePackageRoutes);
router.use('/disputes', disputeRoutes);
router.use('/support/tickets', supportTicketRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/search', searchRoutes);
router.use('/categories', categoryRoutes);
router.use('/skills', skillRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/hire-now', hireNowRoutes);
router.use('/rbac', rbacRoutes);

// Featured freelancers (public route)
router.get('/featured-freelancers', getFeaturedFreelancers);

// Development routes (only in development)
if ((process.env.NODE_ENV === 'development' || process.env.MOCK_STRIPE_CONNECT === 'true') && devRoutes) {
  router.use('/dev', devRoutes);
}

export default router;