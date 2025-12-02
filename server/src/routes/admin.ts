import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getReports,
  assignRole,
  removeRole,
  featureFreelancer,
  unfeatureFreelancer,
  getFeaturedFreelancers,
  reorderFeaturedFreelancers,
  getAnalytics,
} from '@/controllers/adminController';
import {
  getAllTransactions,
  getTransactionStats,
  triggerAutoRelease,
} from '@/controllers/adminTransactionController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:userId/status', updateUserStatus);
router.put('/users/:userId/role', updateUserRole);
router.get('/reports', getReports);

// Role management
router.post('/users/:userId/roles', assignRole);
router.delete('/users/:userId/roles', removeRole);

// Featured freelancers - both route formats for compatibility
router.post('/users/:userId/feature', featureFreelancer);
router.post('/users/:userId/unfeature', unfeatureFreelancer);
router.post('/featured-freelancers/:userId/feature', featureFreelancer);
router.delete('/featured-freelancers/:userId/unfeature', unfeatureFreelancer);
router.get('/featured-freelancers', getFeaturedFreelancers);
router.put('/featured-freelancers/reorder', reorderFeaturedFreelancers);

// Analytics
router.get('/analytics', getAnalytics);

// Transaction management
router.get('/transactions', getAllTransactions);
router.get('/transactions/stats', getTransactionStats);
router.post('/transactions/auto-release', triggerAutoRelease);

export default router;