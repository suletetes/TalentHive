import { Router } from 'express';
import { protect, restrictTo } from '@/middleware/auth';
import {
  createWorkLog,
  completeWorkLog,
  updateWorkLog,
  deleteWorkLog,
  getWorkLogs,
  getWorkLogReport,
} from '@/controllers/workLogController';

const router = Router();

// All routes require authentication
router.use(protect);

// Work log CRUD routes (freelancers only for create/update/delete)
router.post('/', restrictTo('freelancer'), createWorkLog);
router.patch('/:id/complete', restrictTo('freelancer'), completeWorkLog);
router.patch('/:id', restrictTo('freelancer'), updateWorkLog);
router.delete('/:id', restrictTo('freelancer'), deleteWorkLog);

// Get work logs (both freelancers and clients)
router.get('/', getWorkLogs);

// Reports
router.get('/report', getWorkLogReport);

export default router;
