import express from 'express';
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  addMember,
  removeMember,
  updateBudget,
  getOrganizationProjects,
} from '@/controllers/organizationController';
import { authenticate } from '@/middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createOrganization);
router.get('/', getOrganizations);
router.get('/:id', getOrganizationById);
router.put('/:id', updateOrganization);
router.delete('/:id', deleteOrganization);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/budget', updateBudget);
router.get('/:id/projects', getOrganizationProjects);

export default router;
