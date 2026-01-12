import { Router } from 'express';
import {
  createProposal,
  createProposalValidation,
  getProposalsForProject,
  getMyProposals,
  getProposalById,
  updateProposal,
  withdrawProposal,
  acceptProposal,
  rejectProposal,
  highlightProposal,
  getProposalStats,
  deleteProposal,
} from '@/controllers/proposalController';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// Protected routes (require authentication)
router.use(authenticate);

// Specific routes must come before parameterized routes
router.get('/my', authorize('freelancer'), getMyProposals);
router.get('/stats', getProposalStats);
router.get('/project/:projectId', getProposalsForProject);
router.post('/project/:projectId', authorize('freelancer'), createProposalValidation, createProposal);

// Freelancer routes with :id parameter
router.get('/:id', getProposalById);
router.put('/:id', authorize('freelancer'), updateProposal);
router.patch('/:id/withdraw', authorize('freelancer'), withdrawProposal);
router.delete('/:id/delete', authorize('freelancer'), deleteProposal);
router.patch('/:id/highlight', authorize('freelancer'), highlightProposal);

// Client routes
router.post('/:id/accept', authorize('client'), acceptProposal);
router.post('/:id/reject', authorize('client'), rejectProposal);

export default router;