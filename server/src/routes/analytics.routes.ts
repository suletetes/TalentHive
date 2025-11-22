import express from 'express';
import { analyticsController } from '@/controllers/analyticsController';
import { auth } from '@/middleware/auth';
import { roleAuth } from '@/middleware/roleAuth';

const router = express.Router();

// All analytics routes require authentication and admin role
router.use(auth);
router.use(roleAuth(['admin']));

// Analytics endpoints
router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/user-growth', analyticsController.getUserGrowthAnalytics);
router.get('/projects', analyticsController.getProjectStats);
router.get('/payments', analyticsController.getPaymentAnalytics);
router.get('/dashboard', analyticsController.getDashboardOverview);

export default router;
