import { Router } from 'express';
import {
  createProject,
  createProjectValidation,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getMyProjects,
  searchProjects,
  getProjectCategories,
  getProjectStats,
  toggleProjectStatus,
} from '@/controllers/projectController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// Public routes
router.get('/', getProjects);
router.get('/search', searchProjects);
router.get('/categories', getProjectCategories);
router.get('/:id', getProjectById);

// Protected routes (require authentication)
router.use(authenticate);

// Client-only routes
router.post('/', authorize('client'), createProjectValidation, createProject);
router.get('/my/projects', getMyProjects);
router.get('/my/stats', getProjectStats);
router.put('/:id', authorize('client'), updateProject);
router.delete('/:id', authorize('client'), deleteProject);
router.patch('/:id/status', authorize('client'), toggleProjectStatus);

export default router;