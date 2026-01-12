import { Router } from 'express';
import {
  createDispute,
  createDisputeValidation,
  getAllDisputes,
  getMyDisputes,
  getDisputeById,
  addDisputeMessage,
  updateDisputeStatus,
  assignDispute,
  getDisputeStats,
} from '@/controllers/disputeController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.post('/', createDisputeValidation, createDispute);
router.get('/my', getMyDisputes);
router.get('/:id', getDisputeById);
router.post('/:id/messages', addDisputeMessage);

// Admin routes
router.get('/', authorize('admin'), getAllDisputes);
router.patch('/:id/status', authorize('admin'), updateDisputeStatus);
router.patch('/:id/assign', authorize('admin'), assignDispute);
router.get('/stats/overview', authorize('admin'), getDisputeStats);

export default router;
