import { Router } from 'express';

const router = Router();

// Placeholder routes
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Get notifications - to be implemented' });
});

router.put('/:id/read', (req, res) => {
  res.status(501).json({ message: 'Mark notification as read - to be implemented' });
});

router.put('/mark-all-read', (req, res) => {
  res.status(501).json({ message: 'Mark all notifications as read - to be implemented' });
});

export default router;