import { Router } from 'express';
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from '@/controllers/skillController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// Public routes
router.get('/', getSkills);

// Protected routes
router.post('/', authenticate, authorize('admin', 'freelancer'), createSkill);
router.put('/:id', authenticate, authorize('admin'), updateSkill);
router.delete('/:id', authenticate, authorize('admin'), deleteSkill);

export default router;
