import { Router } from 'express';
import { protect, restrictTo } from '@/middleware/auth';
import {
  createOrganization,
  getOrganization,
  updateOrganization,
  inviteMember,
  removeMember,
  updateMemberRole,
  createBudgetApproval,
  reviewBudgetApproval,
  getBudgetApprovals,
  getUserOrganizations,
} from '@/controllers/organizationController';

const router = Router();

// All routes require authentication
router.use(protect);

// Organization routes
router.post('/', restrictTo('client'), createOrganization);
router.get('/my-organizations', getUserOrganizations);
router.get('/:organizationId', getOrganization);
router.patch('/:organizationId', updateOrganization);

// Member management
router.post('/:organizationId/members/invite', inviteMember);
router.delete('/:organizationId/members/:memberId', removeMember);
router.patch('/:organizationId/members/:memberId/role', updateMemberRole);

// Budget approval routes
router.post('/budget-approvals', createBudgetApproval);
router.get('/budget-approvals', getBudgetApprovals);
router.patch('/budget-approvals/:approvalId/review', reviewBudgetApproval);

export default router;
