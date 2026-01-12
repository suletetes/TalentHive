import { Router } from 'express';
import {
  searchProjects,
  searchFreelancers,
  getRecommendations,
  getSearchSuggestions,
} from '@/controllers/searchController';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.get('/projects', searchProjects);
router.get('/freelancers', searchFreelancers);
router.get('/suggestions', getSearchSuggestions);
router.get('/recommendations', authenticate, getRecommendations);

export default router;