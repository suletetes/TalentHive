import express from 'express';
import {
  getUserGrowth,
  getRevenueMetrics,
  getProjectStats,
  getTopUsers,
  getCategoryDistribution
} from '@/controllers/analyticsController';
import { protect } from '@/middleware/auth';
import { authorizeRoles } from '@/middleware/roleAuth';

const router = express.Router();

// All analytics routes require authentication and admin role
router.use(protect);
router.use(authorizeRoles('admin'));

// Analytics endpoints
router.get('/user-growth', getUserGrowth);
router.get('/revenue', getRevenueMetrics);
router.get('/projects', getProjectStats);
router.get('/top-users', getTopUsers);
router.get('/categories', getCategoryDistribution);

export default router;
