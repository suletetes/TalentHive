import express from 'express';
import { settingsController } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', settingsController.getSettings);
router.post('/calculate-commission', settingsController.calculateCommission);

// Admin only routes
router.put('/', authenticate, authorize('admin'), settingsController.updateSettings);
router.get('/history', authenticate, authorize('admin'), settingsController.getSettingsHistory);

export default router;
