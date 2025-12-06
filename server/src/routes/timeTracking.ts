import { Router } from 'express';
import { protect, restrictTo } from '@/middleware/auth';
import {
  startWorkSession,
  stopWorkSession,
  getActiveSession,
  createTimeEntry,
  updateTimeEntry,
  submitTimeEntries,
  reviewTimeEntry,
  getTimeEntries,
  getTimeReport,
} from '@/controllers/timeTrackingController';

const router = Router();

// All routes require authentication
router.use(protect);

// Work session routes (freelancers only)
router.get('/sessions/active', restrictTo('freelancer'), getActiveSession);
router.post('/sessions/start', restrictTo('freelancer'), startWorkSession);
router.patch('/sessions/:sessionId/stop', restrictTo('freelancer'), stopWorkSession);

// Time entry routes
router.post('/entries', restrictTo('freelancer'), createTimeEntry);
router.patch('/entries/:entryId', restrictTo('freelancer'), updateTimeEntry);
router.post('/entries/submit', restrictTo('freelancer'), submitTimeEntries);
router.get('/entries', getTimeEntries);

// Time entry review (clients)
router.patch('/entries/:entryId/review', restrictTo('client'), reviewTimeEntry);

// Reports
router.get('/reports', getTimeReport);

export default router;
