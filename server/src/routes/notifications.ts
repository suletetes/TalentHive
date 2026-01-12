import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/controllers/notificationController';
import { authenticate } from '@/middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Specific routes MUST come before parameterized routes
router.get('/unread-count', getUnreadCount);
router.put('/mark-all-read', markAllAsRead);

// General routes
router.get('/', getNotifications);

// Parameterized routes (must come last)
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
