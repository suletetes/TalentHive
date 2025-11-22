import express from 'express';
import { settingsController } from '../controllers/settingsController';
import { auth } from '../middleware/auth';
import { roleAuth } from '../middleware/roleAuth';

const router = express.Router();

// Public routes
router.get('/', settingsController.getSettings);
router.post('/calculate-commission', settingsController.calculateCommission);

// Admin only routes
router.put('/', auth, roleAuth(['admin']), settingsController.updateSettings);
router.get('/history', auth, roleAuth(['admin']), settingsController.getSettingsHistory);

export default router;
