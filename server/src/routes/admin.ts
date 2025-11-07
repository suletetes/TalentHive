import { Router } from 'express';
import { getDashboardStats, getUsers, updateUserStatus, getReports } from '@/controllers/adminController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:userId/status', updateUserStatus);
router.get('/reports', getReports);

export default router;