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
import organizationRoutes from './organizations';
import servicePackageRoutes from './servicePackages';

const router = Router();

// Health check for API
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'TalentHive API is running',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check routes (no /api prefix needed)
router.use('/', healthRoutes);

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
router.use('/organizations', organizationRoutes);
router.use('/services', servicePackageRoutes);

// Import and use search routes
import searchRoutes from './search';
router.use('/search', searchRoutes);

// Category and skill routes
import categoryRoutes from './categories';
import skillRoutes from './skills';
router.use('/categories', categoryRoutes);
router.use('/skills', skillRoutes);

// Webhook routes
import webhookRoutes from './webhook.routes';
router.use('/webhooks', webhookRoutes);

// Analytics routes (admin only)
import analyticsRoutes from './analytics.routes';
router.use('/analytics', analyticsRoutes);

// Hire Now routes
import hireNowRoutes from './hireNow.routes';
router.use('/hire-now', hireNowRoutes);

// Featured freelancers (public route)
import { getFeaturedFreelancers } from '@/controllers/adminController';
router.get('/featured-freelancers', getFeaturedFreelancers);

export default router;