import { Router } from 'express';

const router = Router();

// Placeholder routes
router.get('/user/:userId', (req, res) => {
  res.status(501).json({ message: 'Get user reviews - to be implemented' });
});

router.post('/', (req, res) => {
  res.status(501).json({ message: 'Create review - to be implemented' });
});

router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Get review by ID - to be implemented' });
});

export default router;