import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/controllers/categoryController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// Public routes
router.get('/', getCategories);

// Protected routes (admin only)
router.post('/', authenticate, authorize('admin', 'client'), createCategory);
router.put('/:id', authenticate, authorize('admin'), updateCategory);
router.delete('/:id', authenticate, authorize('admin'), deleteCategory);

export default router;
