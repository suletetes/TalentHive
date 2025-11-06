import { Router } from 'express';

const router = Router();

// Placeholder routes
router.get('/dashboard', (req, res) => {
  res.status(501).json({ message: 'Admin dashboard - to be implemented' });
});

router.get('/users', (req, res) => {
  res.status(501).json({ message: 'Admin get users - to be implemented' });
});

router.put('/users/:id/status', (req, res) => {
  res.status(501).json({ message: 'Admin update user status - to be implemented' });
});

router.get('/reports', (req, res) => {
  res.status(501).json({ message: 'Admin reports - to be implemented' });
});

router.get('/disputes', (req, res) => {
  res.status(501).json({ message: 'Admin disputes - to be implemented' });
});

export default router;