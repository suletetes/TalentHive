import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
} from '@/controllers/notificationController';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.post('/:notificationId/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.delete('/:notificationId', deleteNotification);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;