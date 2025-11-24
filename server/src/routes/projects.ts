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
  getMyProjectStats,
  toggleProjectStatus,
} from '@/controllers/projectController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// Public routes
router.get('/', getProjects);
router.get('/search', searchProjects);
router.get('/categories', getProjectCategories);

// Protected routes (require authentication)
router.use(authenticate);

// Client-only routes - MUST come before /:id to avoid route matching issues
router.post('/', authorize('client'), createProjectValidation, createProject);
router.get('/my/projects', getMyProjects);
router.get('/my/stats', getMyProjectStats);
router.put('/:id', authorize('client'), updateProject);
router.delete('/:id', authorize('client'), deleteProject);
router.patch('/:id/status', authorize('client'), toggleProjectStatus);

// Get project by ID - MUST come last
router.get('/:id', getProjectById);

export default router;