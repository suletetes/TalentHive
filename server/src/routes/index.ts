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
import adminRoutes from './admin';

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
router.use('/admin', adminRoutes);

export default router;