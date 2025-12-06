import express from 'express';
import { analyticsController } from '@/controllers/analyticsController';
import { authenticate, authorize } from '@/middleware/auth';

const router = express.Router();

// All analytics routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Analytics endpoints
router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/user-growth', analyticsController.getUserGrowthAnalytics);
router.get('/projects', analyticsController.getProjectStats);
router.get('/payments', analyticsController.getPaymentAnalytics);
router.get('/dashboard', analyticsController.getDashboardOverview);

export default router;
